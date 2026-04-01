interface ImagePreviewProps {
  dataUrl: string
  onRemove: () => void
}

export function ImagePreview({ dataUrl, onRemove }: ImagePreviewProps) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <img
        src={dataUrl}
        alt="Selected image"
        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, display: 'block' }}
      />
      <button
        onClick={onRemove}
        aria-label="Remove image"
        style={{
          position: 'absolute', top: -6, right: -6,
          width: 20, height: 20, borderRadius: '50%',
          border: 'none', cursor: 'pointer',
          background: '#666', color: '#fff',
          fontSize: 12, lineHeight: '20px', textAlign: 'center', padding: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}
