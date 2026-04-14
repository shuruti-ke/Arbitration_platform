// frontend/src/App.test.js
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders arbitration platform title', () => {
  render(<App />);
  const linkElement = screen.getByText(/Arbitration Platform/i);
  expect(linkElement).toBeInTheDocument();
});