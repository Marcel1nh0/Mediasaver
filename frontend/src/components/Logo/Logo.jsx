import "./Logo.css";

/** Logo do MediaSaver: um rolo de filme estilizado + "Media" e "Saver" em itálico. */
function Logo({ claro = false }) {
    return (
        <span className={`logo ${claro ? "logo-claro" : ""}`}>
            <svg className="logo-icone" viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
                <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="16" cy="10.2" r="3.7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="10.6" cy="19.4" r="3.7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="21.4" cy="19.4" r="3.7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="16" cy="16" r="1.2" fill="currentColor" />
            </svg>
            <span className="logo-texto">
                Media<em>Saver</em>
            </span>
        </span>
    );
}

export default Logo;
