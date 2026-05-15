import { JSDOM } from "jsdom";
import sinon from "sinon";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.HTMLInputElement = dom.window.HTMLInputElement;
globalThis.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
globalThis.HTMLSelectElement = dom.window.HTMLSelectElement;
globalThis.File = dom.window.File;
globalThis.FormData = dom.window.FormData;
globalThis.Image = class {
  constructor() {
    this.complete = true;
    this.naturalWidth = 1;
    setTimeout(() => this.onload?.(), 0);
  }
};

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: sinon.stub().callsFake((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: sinon.stub(),
    removeListener: sinon.stub(),
    addEventListener: sinon.stub(),
    removeEventListener: sinon.stub(),
    dispatchEvent: sinon.stub(),
  })),
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock;
globalThis.IntersectionObserver = IntersectionObserverMock;
globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.scrollTo = sinon.stub();

const { cleanup } = await import("@testing-library/react");

afterEach(() => {
  cleanup();
  sinon.restore();
  document.body.innerHTML = "";
});
