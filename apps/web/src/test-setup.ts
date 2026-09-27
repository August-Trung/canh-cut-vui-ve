if (typeof globalThis.localStorage === 'undefined') {
  class MemoryStorage implements Storage {
    private store = new Map<string, string>();

    get length(): number {
      return this.store.size;
    }

    clear(): void {
      this.store.clear();
    }

    getItem(key: string): string | null {
      return this.store.has(key) ? this.store.get(key)! : null;
    }

    key(index: number): string | null {
      const keys = Array.from(this.store.keys());
      return keys[index] ?? null;
    }

    removeItem(key: string): void {
      this.store.delete(key);
    }

    setItem(key: string, value: string): void {
      this.store.set(key, String(value));
    }
  }

  globalThis.localStorage = new MemoryStorage();
}

if (typeof globalThis.window === 'undefined') {
  const dummyContext: Record<string, unknown> = new Proxy(
    {
      getImageData: () => ({ data: [0, 0, 0, 0] }),
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      measureText: () => ({ width: 0, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0 }),
    },
    {
      get(target, prop) {
        if (prop in target) return (target as Record<string, unknown>)[prop as string];
        return () => {};
      },
      set(target, prop, value) {
        (target as Record<string, unknown>)[prop as string] = value;
        return true;
      },
    }
  );

  globalThis.window = globalThis as unknown as Window & typeof globalThis;
  globalThis.navigator = { userAgent: 'node' } as unknown as Navigator;
  globalThis.Image = class {} as unknown as typeof Image;
  globalThis.HTMLCanvasElement = class {} as unknown as typeof HTMLCanvasElement;
  globalThis.HTMLVideoElement = class {} as unknown as typeof HTMLVideoElement;
  globalThis.document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => dummyContext,
          toDataURL: () => 'data:image/png;base64,',
        };
      }
      return {};
    },
    documentElement: {},
  } as unknown as Document;
}
