import React from "react";
import ReactDOM from "react-dom/client";

import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Home from "./Pages/Home/Home";
import Login from "./Pages/Login/Login";
import Cadastro from "./Pages/Cadastro/Cadastro";
import Edicao from "./Pages/Edicao/Edicao";
import Post from "./Pages/Post/Post";
import Perfil from "./Pages/Perfil/Perfil";
import Doacao from "./Pages/Doacao/Doacao";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>

            <div className="app">

                <Routes>

                    <Route
                        path="/"
                        element={<Home />}
                    />

                    <Route
                        path="/login"
                        element={<Login />}
                    />

                    <Route
                        path="/cadastro"
                        element={<Cadastro />}
                    />

                    <Route
                        path="/edicao"
                        element={<Edicao />}
                    />

                    <Route
                        path="/post"
                        element={<Post />}
                    />

                    <Route
                        path="/perfil"
                        element={<Perfil />}
                    />

                    <Route
                        path="/doacao"
                        element={<Doacao />}
                    />

                </Routes>

            </div>

        </BrowserRouter>
    </React.StrictMode>
);