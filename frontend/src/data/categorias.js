import { Camera, Disc3, Videotape, RadioReceiver, CassetteTape, Gamepad2, Package } from "lucide-react";

// Os valores precisam ser os mesmos que a API aceita (PostEndpoints.Categorias).
// "ebay" é o termo em inglês usado no botão "Buscar no eBay" do post.
// "plural" aparece na lista de categorias da tela de login.
export const categorias = [
    { valor: "camera", rotulo: "Câmera", plural: "Câmeras", Icone: Camera, ebay: "camera" },
    { valor: "vinil", rotulo: "Vinil", plural: "Vinis", Icone: Disc3, ebay: "vinyl record" },
    { valor: "video", rotulo: "Vídeo", plural: "Vídeo", Icone: Videotape, ebay: "VHS" },
    { valor: "radio", rotulo: "Rádio", plural: "Rádios", Icone: RadioReceiver, ebay: "vintage radio" },
    { valor: "audio", rotulo: "Áudio", plural: "Áudio", Icone: CassetteTape, ebay: "cassette player" },
    { valor: "game", rotulo: "Videogame", plural: "Videogames", Icone: Gamepad2, ebay: "video game console" },
    { valor: "outro", rotulo: "Outro", plural: "Outros", Icone: Package, ebay: "vintage" }
];

export function buscarCategoria(valor) {
    return categorias.find((c) => c.valor === valor) ?? categorias[categorias.length - 1];
}
