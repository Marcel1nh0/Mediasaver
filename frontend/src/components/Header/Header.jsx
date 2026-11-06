import "./Header.css";

function Header() {
    return (
        <header className="header">
            <div className="logo">
                <span className="logo-icone"><img src="src/assets/media_saver_logo.png" alt="logo"/></span>

                <h1>MEDIASAVER</h1>
            </div>
        </header>
    );
}

export default Header;