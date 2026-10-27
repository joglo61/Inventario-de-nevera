"use client";

// Botón de formulario que pregunta antes de enviar (sacar a alguien, salir de la casa).
export default function Confirmar({
  pregunta,
  className,
  children,
}: {
  pregunta: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(pregunta)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
