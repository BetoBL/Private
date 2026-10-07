import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import { Agenda } from "./pages/Agenda";
import { BibliotecaDeTestes } from "./pages/BibliotecaDeTestes";
import { CadastroClinica } from "./pages/CadastroClinica";
import { CadastroProfissional } from "./pages/CadastroProfissional";
import { CadastroNormativas } from "./pages/CadastroNormativas";
import { CadastroTiposAtendimento } from "./pages/CadastroTiposAtendimento";
import { ComposicaoLaudo } from "./pages/ComposicaoLaudo";
import { FichaPaciente } from "./pages/FichaPaciente";
import { FichaProfissional } from "./pages/FichaProfissional";
import { IniciarAtendimento } from "./pages/IniciarAtendimento";
import { LancamentoTeste } from "./pages/LancamentoTeste";
import { Login } from "./pages/Login";
import { PainelDoDia } from "./pages/PainelDoDia";
import { PerfilAtuacao } from "./pages/PerfilAtuacao";
import { Pacientes } from "./pages/Pacientes";
import { TesteCompleto } from "./pages/TesteCompleto";

function App() {
  const { profissional } = useAuth();


  if (!profissional) {
    return <Login />;
  }

  return (
    <Routes>
      {/* Fora do <Layout/> de propósito: ambiente visual próprio, sem a sidebar escura da
          gestão da clínica (ver pages/BibliotecaDeTestes.tsx). */}
      <Route path="/biblioteca" element={<BibliotecaDeTestes />} />
      {/* Tela cheia de um teste numa sessão (sem a sidebar), aberta pela ficha do paciente */}
      <Route path="/teste-completo" element={<TesteCompleto />} />
      <Route element={<Layout />}>
        <Route path="/" element={<PainelDoDia />} />
        <Route path="/pacientes" element={<Pacientes />} />
        <Route path="/pacientes/:id" element={<FichaPaciente />} />
        <Route path="/iniciar-atendimento" element={<IniciarAtendimento />} />
        <Route path="/testes" element={<LancamentoTeste />} />
        <Route path="/laudo" element={<ComposicaoLaudo />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/perfil-atuacao" element={<PerfilAtuacao />} />
        <Route path="/clinica" element={<CadastroClinica />} />
        <Route path="/profissionais" element={<CadastroProfissional />} />
        <Route path="/profissionais/:id" element={<FichaProfissional />} />
        <Route path="/tipos-atendimento" element={<CadastroTiposAtendimento />} />
        <Route path="/normativas" element={<CadastroNormativas />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
