import "./Header.css";
import logo from "../../assets/media_saver_logo.png";
import { Link } from "react-router-dom";

function Header() {
    return (
        <header className="header">
            <Link className="logo" to="/" aria-label="MediaSaver, página inicial">
                <img src={logo} alt="" />
                <h1>MEDIASAVER</h1>
            </Link>
        </header>
    );
}

export default Header;