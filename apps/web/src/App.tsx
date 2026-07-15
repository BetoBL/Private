import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import { Agenda } from "./pages/Agenda";
import { CadastroClinica } from "./pages/CadastroClinica";
import { CadastroProfissional } from "./pages/CadastroProfissional";
import { ComposicaoLaudo } from "./pages/ComposicaoLaudo";
import { FichaPaciente } from "./pages/FichaPaciente";
import { FichaProfissional } from "./pages/FichaProfissional";
import { LancamentoTeste } from "./pages/LancamentoTeste";
import { Login } from "./pages/Login";
import { PainelDoDia } from "./pages/PainelDoDia";
import { PerfilAtuacao } from "./pages/PerfilAtuacao";
import { Pacientes } from "./pages/Pacientes";

function App() {
  const { profissional } = useAuth();

  if (!profissional) {
    return <Login />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<PainelDoDia />} />
        <Route path="/pacientes" element={<Pacientes />} />
        <Route path="/pacientes/:id" element={<FichaPaciente />} />
        <Route path="/testes" element={<LancamentoTeste />} />
        <Route path="/laudo" element={<ComposicaoLaudo />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/perfil-atuacao" element={<PerfilAtuacao />} />
        <Route path="/clinica" element={<CadastroClinica />} />
        <Route path="/profissionais" element={<CadastroProfissional />} />
        <Route path="/profissionais/:id" element={<FichaProfissional />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
