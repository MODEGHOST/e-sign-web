import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ContractEditor from "./pages/admin/ContractEditor"; // สำหรับแอดมิน
import DisplayContract from "./pages/Customer/DisplayContract"; // สำหรับลูกค้า
import CompanySign from "./pages/admin/CompanySign";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* แอดมิน */}
        <Route path="/admin" element={<ContractEditor />} />

        {/* ลูกค้า: เส้นทางสำหรับดูสัญญา */}
        <Route path="/sign/:documentId" element={<DisplayContract />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/sign/demo" replace />} />

        <Route path="/admin/sign/:documentId" element={<CompanySign />} />
      </Routes>
    </BrowserRouter>
  );
}
