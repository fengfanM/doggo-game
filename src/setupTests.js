// Setup tests configuration
import '@testing-library/jest-dom';

// Mock Taro for testing
global.Taro = {
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn()
};

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (/Warning|Deprecation/i.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
