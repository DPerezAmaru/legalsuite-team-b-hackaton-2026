export function ExpedientesTableHeader() {
  return (
    <div className="flex items-center gap-4 px-3 py-2 text-[11px] font-medium text-fg-tertiary uppercase tracking-wider border-b border-border">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <span className="w-3.75 shrink-0" aria-hidden="true" />
        <span>Expediente</span>
      </div>
      <div className="hidden @2xl/table:block w-44">Demandante</div>
      <div className="hidden @3xl/table:block w-44">Demandado</div>
      <div className="hidden @lg/table:block w-24">Especialidad</div>
      <div className="hidden @5xl/table:block w-44">Despacho</div>
      <div className="w-28">Estado</div>
      <div className="w-16 text-right">Creado</div>
    </div>
  )
}
