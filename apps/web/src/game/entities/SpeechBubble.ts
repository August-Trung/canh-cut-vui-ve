import Phaser from 'phaser';

export const PENGUIN_QUIPS: string[] = [
  'Trời hôm nay mát ghê!',
  'Có ai thấy cá của tui hong?',
  'Trượt băng vui quá xá!',
  'Ước gì có một bé cá hồi béo ngậy...',
  'Đảo tuyết hôm nay đẹp ghê á!',
  'Lạnh tê cánh nhưng mà siêu vui!',
  'Chào bạn nha! Cùng đi dạo hong?',
  'Khò khò... mơ thấy núi tuyết toàn cá...',
  'Gió bắc thổi lạnh buốt mà thích quá!',
  'Tập nhảy xoay vòng 360 độ nè!',
];

/**
 * Cute stylized speech bubble container that pops up over penguins.
 * Features rounded vector bubble graphics, playful pop-in scale tween,
 * and auto-fadeout timer.
 */
export class SpeechBubble extends Phaser.GameObjects.Container {
  private bubbleBg: Phaser.GameObjects.Graphics;
  private bubbleText: Phaser.GameObjects.Text;
  private hideTimer: Phaser.Time.TimerEvent | null = null;
  private activeTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x = 0, y = 0) {
    super(scene, x, y);

    this.bubbleBg = scene.add.graphics();
    this.add(this.bubbleBg);

    this.bubbleText = scene.add.text(0, 0, '', {
      fontFamily: `'Nunito', 'Segoe UI', -apple-system, sans-serif`,
      fontSize: '12px',
      color: '#1E293B',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 140, useAdvancedWrap: true },
    });
    this.bubbleText.setOrigin(0.5, 0.5);
    this.add(this.bubbleText);

    this.setVisible(false);
    this.setAlpha(0);
    this.setScale(0);
  }

  /**
   * Display specified text with cute pop-in animation and auto-fade.
   */
  showText(text: string, durationMs = 3500): void {
    this.clearTimersAndTweens();

    this.bubbleText.setText(text);

    // Compute dimensions with padding
    const paddingX = 14;
    const paddingY = 8;
    const width = Math.max(64, this.bubbleText.width + paddingX * 2);
    const height = Math.max(28, this.bubbleText.height + paddingY * 2);

    // Redraw bubble graphics
    this.drawBubble(width, height);

    // Position text in center of bubble (bubble extends upwards from origin)
    this.bubbleText.setPosition(0, -height / 2 - 6);

    this.setVisible(true);
    this.setAlpha(1);
    this.setScale(0);

    // Pop-in bounce animation
    this.activeTween = this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 250,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.activeTween = null;
        // Schedule auto-fadeout
        this.hideTimer = this.scene.time.delayedCall(durationMs, () => {
          this.fadeOut();
        });
      },
    });
  }

  /**
   * Display a random cute penguin quip.
   */
  showRandomQuip(durationMs = 3500): string {
    const quip = PENGUIN_QUIPS[Math.floor(Math.random() * PENGUIN_QUIPS.length)];
    this.showText(quip, durationMs);
    return quip;
  }

  /**
   * Fade out smoothly and hide.
   */
  fadeOut(durationMs = 300): void {
    this.clearTimersAndTweens();

    this.activeTween = this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.7,
      scaleY: 0.7,
      duration: durationMs,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.activeTween = null;
        this.setVisible(false);
      },
    });
  }

  /**
   * Hide immediately without animation.
   */
  hide(): void {
    this.clearTimersAndTweens();
    this.setVisible(false);
    this.setAlpha(0);
    this.setScale(0);
  }

  private drawBubble(width: number, height: number): void {
    this.bubbleBg.clear();

    const x = -width / 2;
    const y = -height - 8;
    const radius = 10;
    const pointerHeight = 8;
    const pointerWidth = 10;

    // Soft drop shadow
    this.bubbleBg.fillStyle(0x0f172a, 0.2);
    this.bubbleBg.fillRoundedRect(x, y + 3, width, height, radius);

    // Speech bubble background fill
    this.bubbleBg.fillStyle(0xffffff, 1.0);
    this.bubbleBg.fillRoundedRect(x, y, width, height, radius);
    this.bubbleBg.lineStyle(2, 0x1e293b, 1.0);
    this.bubbleBg.strokeRoundedRect(x, y, width, height, radius);

    // Speech pointer tail pointing down towards penguin's head
    this.bubbleBg.fillStyle(0xffffff, 1.0);
    this.bubbleBg.beginPath();
    this.bubbleBg.moveTo(-pointerWidth / 2, y + height);
    this.bubbleBg.lineTo(0, y + height + pointerHeight);
    this.bubbleBg.lineTo(pointerWidth / 2, y + height);
    this.bubbleBg.closePath();
    this.bubbleBg.fillPath();

    // Border line on pointer tail
    this.bubbleBg.lineStyle(2, 0x1e293b, 1.0);
    this.bubbleBg.beginPath();
    this.bubbleBg.moveTo(-pointerWidth / 2, y + height);
    this.bubbleBg.lineTo(0, y + height + pointerHeight);
    this.bubbleBg.lineTo(pointerWidth / 2, y + height);
    this.bubbleBg.strokePath();

    // Overwrite inner seam between bubble and pointer with white line
    this.bubbleBg.lineStyle(2.5, 0xffffff, 1.0);
    this.bubbleBg.beginPath();
    this.bubbleBg.moveTo(-pointerWidth / 2 + 1, y + height);
    this.bubbleBg.lineTo(pointerWidth / 2 - 1, y + height);
    this.bubbleBg.strokePath();
  }

  private clearTimersAndTweens(): void {
    this.hideTimer?.remove();
    this.hideTimer = null;

    if (this.activeTween) {
      this.activeTween.stop();
      this.activeTween = null;
    }
  }

  override destroy(fromScene?: boolean): void {
    this.clearTimersAndTweens();
    super.destroy(fromScene);
  }
}
