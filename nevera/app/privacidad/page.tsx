import Link from "next/link";
import Documento, { CONTACTO } from "../legal";

export const metadata = { title: "Política de privacidad · Nevera" };

export default function Privacidad() {
  return (
    <Documento titulo="Política de privacidad">
      <p>
        Esta política explica cómo Nevera trata tus datos personales, según la Ley 1581 de 2012 y el Decreto 1377
        de 2013 de Colombia.
      </p>

      <h2>Responsable</h2>
      <p>
        Juan Camilo García Martínez, en Colombia. Contacto: <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a>.
      </p>

      <h2>Qué datos guardamos</h2>
      <ul>
        <li>Tu correo electrónico, para que entres con un código.</li>
        <li>El nombre que escribes al crear una casa o pedir acceso.</li>
        <li>Las casas de las que haces parte y tu rol (dueño o integrante).</li>
        <li>Los productos, notas y horarios que registras en tu casa.</li>
        <li>Si activas los avisos, un identificador técnico de tu celular para poder enviarte notificaciones.</li>
        <li>Datos técnicos como la dirección IP, que usan nuestros proveedores por seguridad y para evitar abusos.</li>
      </ul>

      <h2>Para qué los usamos</h2>
      <ul>
        <li>Dejarte entrar y mantener tu sesión.</li>
        <li>Compartir la lista de tu casa con los integrantes que el dueño apruebe.</li>
        <li>Enviarte el recordatorio con lo que falta, si lo activas.</li>
        <li>Entregar la lista a los atajos que configures con la clave de tu casa.</li>
        <li>Proteger el servicio contra accesos no autorizados.</li>
      </ul>
      <p>No vendemos tus datos, no los usamos para publicidad y no los compartimos con terceros para otros fines.</p>

      <h2>Quién más los ve</h2>
      <p>
        Los integrantes activos de tu casa ven tu nombre y tu correo. Para funcionar usamos estos proveedores, que
        procesan los datos por nuestra cuenta: Supabase (base de datos e inicio de sesión), Netlify (la aplicación),
        Cloudflare (verificación contra robots), Google (envío de los correos con el código) y los servicios de
        notificaciones de Apple y Google. Sus servidores están principalmente en Estados Unidos; al usar Nevera
        autorizas esa transferencia internacional.
      </p>

      <h2>Cuánto tiempo los guardamos</h2>
      <p>
        Mientras uses el servicio. Si pides que borremos tus datos, los eliminamos de la aplicación. Guardamos copias
        de seguridad privadas que solo se usan para recuperar el servicio si algo falla.
      </p>

      <h2>Tus derechos</h2>
      <p>Puedes conocer, actualizar, corregir y pedir que borremos tus datos, y retirar tu autorización. Para eso:</p>
      <ul>
        <li>
          Escríbenos a <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a> desde el correo con el que entras.
        </li>
        <li>Respondemos consultas en máximo 10 días hábiles y reclamos en máximo 15 días hábiles.</li>
        <li>Si no quedas conforme, puedes acudir a la Superintendencia de Industria y Comercio (SIC).</li>
      </ul>
      <p>
        También puedes salir de una casa desde la aplicación, y el dueño puede sacar integrantes y cambiar la clave de
        los atajos.
      </p>

      <h2>Seguridad</h2>
      <p>
        Entras con un código que llega a tu correo, sin contraseñas. Cada casa solo es visible para sus integrantes
        aprobados, y las conexiones van cifradas. Ningún sistema es infalible, pero tomamos medidas razonables para
        proteger tu información.
      </p>

      <h2>Menores de edad</h2>
      <p>Nevera está pensada para mayores de edad. Un menor puede usarla dentro de su hogar con permiso de sus padres.</p>

      <h2>Cambios</h2>
      <p>
        Si cambiamos esta política, publicaremos la nueva versión aquí con su fecha. Ver también los{" "}
        <Link href="/terminos">términos de uso</Link>.
      </p>
    </Documento>
  );
}
