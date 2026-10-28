import Link from "next/link";
import Documento, { CONTACTO } from "../legal";

export const metadata = { title: "Términos de uso · Nevera" };

export default function Terminos() {
  return (
    <Documento titulo="Términos de uso">
      <p>Al usar Nevera aceptas estos términos. Si no estás de acuerdo, no uses el servicio.</p>

      <h2>Qué es Nevera</h2>
      <p>
        Una aplicación web para llevar en familia la lista de lo que se acaba en casa. Se activa con un sticker NFC:
        cada sticker corresponde a una casa.
      </p>

      <h2>El sticker</h2>
      <ul>
        <li>Se paga una sola vez. No hay mensualidades.</li>
        <li>La primera persona que lo escanea y entra crea la casa y queda como dueña.</li>
        <li>Si el sticker se daña o se pierde, la casa sigue existiendo y se puede entrar desde la aplicación.</li>
      </ul>

      <h2>Tu cuenta y tu casa</h2>
      <ul>
        <li>Entras con tu correo. Eres responsable de lo que se haga desde tu cuenta.</li>
        <li>El dueño decide quién entra a la casa, puede sacar integrantes y cambiar la clave de los atajos.</li>
        <li>La clave de los atajos funciona como una contraseña: no la compartas fuera de tu casa.</li>
      </ul>

      <h2>Uso correcto</h2>
      <p>
        No uses Nevera para fines ilegales, para acceder a casas ajenas ni para afectar el funcionamiento del
        servicio. Podemos suspender el acceso a quien lo haga.
      </p>

      <h2>Disponibilidad</h2>
      <p>
        Hacemos lo posible para que Nevera funcione siempre, pero se ofrece tal como está y puede tener fallas o
        interrupciones, por ejemplo por mantenimiento o problemas de nuestros proveedores. Los avisos dependen de que
        tu celular tenga las notificaciones permitidas. No respondemos por compras olvidadas ni por daños derivados de
        no poder usar la aplicación, salvo lo que la ley colombiana no permita excluir.
      </p>

      <h2>Si el servicio termina</h2>
      <p>
        Si algún día dejamos de ofrecer Nevera, avisaremos con al menos 30 días de anticipación a los dueños de cada
        casa, para que puedan pedir una copia de su lista.
      </p>

      <h2>Datos personales</h2>
      <p>
        El tratamiento de tus datos se explica en la <Link href="/privacidad">política de privacidad</Link>.
      </p>

      <h2>Cambios y ley aplicable</h2>
      <p>
        Podemos actualizar estos términos y publicaremos la nueva versión aquí. Se rigen por las leyes de Colombia.
        Dudas o reclamos: <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a>.
      </p>
    </Documento>
  );
}
