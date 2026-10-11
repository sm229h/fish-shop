export default function Loading({ text }) {
  return (
    <div className="loading">
      <div className="spinner" style={{ marginLeft: '8px' }} />
      {text && <span style={{ marginRight: '8px' }}>{text}</span>}
    </div>
  );
}
