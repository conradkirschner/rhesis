'use client';

type Props = { message: string };

export default function ErrorBanner({ message }: Props) {
  return (
    <div
      role="alert"
      style={{
        padding: 16,
        borderRadius: 8,
        background: '#fdecea',
        color: '#b71c1c',
        border: '1px solid #f44336',
      }}
      data-test-id="error-banner"
    >
      {message}
    </div>
  );
}