import React from "react";
import ReactDOM from "react-dom/client";

import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import AutenticacaoProvider from "./contexto/AutenticacaoProvider";
import Protegida from "./components/Protegida/Protegida";

import Home from "./Pages/Home/Home";
import Login from "./Pages/Login/Login";
import Cadastro from "./Pages/Cadastro/Cadastro";
import Edicao from "./Pages/Edicao/Edicao";
import Post from "./Pages/Post/Post";
import Perfil from "./Pages/Perfil/Perfil";
import Doacao from "./Pages/Doacao/Doacao";
import EbayDetalhe from "./Pages/EbayDetalhe/EbayDetalhe";
import NaoEncontrado from "./Pages/NaoEncontrado/NaoEncontrado";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <AutenticacaoProvider>

                <div className="app">

                    <Routes>

                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/post/:id" element={<Post />} />
                        <Route path="/ebay/:id" element={<EbayDetalhe />} />
                        <Route path="/doacao" element={<Doacao />} />

                        {/* Só para quem entrou na conta */}
                        <Route path="/cadastro" element={<Protegida><Cadastro /></Protegida>} />
                        <Route path="/post/:id/editar" element={<Protegida><Edicao /></Protegida>} />
                        <Route path="/perfil" element={<Protegida><Perfil /></Protegida>} />

                        <Route path="*" element={<NaoEncontrado />} />

                    </Routes>

                </div>

            </AutenticacaoProvider>
        </BrowserRouter>
    </React.StrictMode>
);
