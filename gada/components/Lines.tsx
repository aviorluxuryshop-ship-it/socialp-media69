/** Başlık satırlarını maskeli olarak açar: ebeveyn `is-in` aldığında satırlar sırayla yükselir. */
export default function Lines({ lines }: { lines: readonly string[] }) {
  return (
    <>
      {lines.map((line, i) => (
        <span className="line" key={i}>
          <span style={{ '--i': i } as React.CSSProperties}>{line}</span>
        </span>
      ))}
    </>
  )
}
