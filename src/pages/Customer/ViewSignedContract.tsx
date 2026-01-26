import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Button, message } from "antd";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ContractRenderer from "../../components/ContractRenderer";
import type { ContractConfig } from "../../types/contract";
import "../../styles/a4.css";

type ApiSignature = {
  role: string;
  signature_image: string;
};

export default function ViewSignedContract() {
  const { documentId } = useParams();
  const [config, setConfig] = useState<ContractConfig | null>(null);
  const [sigMap, setSigMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!documentId) return;

    (async () => {
      try {
        setLoading(true);

        const [contractRes, sigRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/contracts/${documentId}`),
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/contracts/${documentId}/signatures`),
        ]);

        if (!contractRes.ok) throw new Error("ไม่สามารถโหลดข้อมูลสัญญาได้");
        if (!sigRes.ok) throw new Error("ไม่สามารถโหลดลายเซ็นได้");

        const contractData = await contractRes.json();
        const sigData: { signatures: ApiSignature[] } = await sigRes.json();

        setConfig(contractData.config);

        const map: Record<string, string> = {};
        (sigData.signatures || []).forEach((s) => {
          if (s?.role && s?.signature_image) map[s.role] = s.signature_image;
        });
        setSigMap(map);

        setError(null);
      } catch (err: any) {
        setError(err?.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    })();
  }, [documentId]);

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;

    const root = pdfRef.current;
    const toHide = Array.from(root.querySelectorAll(".no-print")) as HTMLElement[];

    try {
      toHide.forEach((el) => (el.style.display = "none"));

      const canvas = await html2canvas(root, {
        scale: 2,
        backgroundColor: "#ffffff",
        ignoreElements: (el) => (el as HTMLElement).classList?.contains("no-print"),
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${config?.title || "contract"}.pdf`);
      message.success("✅ ดาวน์โหลด PDF เรียบร้อยแล้ว");
    } catch {
      message.error("❌ เกิดข้อผิดพลาดระหว่างสร้าง PDF");
    } finally {
      toHide.forEach((el) => (el.style.display = ""));
    }
  };

  if (loading) return <div>กำลังโหลดเอกสาร...</div>;
  if (error) return <div>เกิดข้อผิดพลาด: {error}</div>;
  if (!config) return null;

  return (
    <div style={{ margin: "0 auto", maxWidth: 900 }}>
      <div ref={pdfRef}>
        <ContractRenderer config={config} mode="final" customerSignatureMap={sigMap} />
      </div>

      <div className="no-print" style={{ textAlign: "center", marginTop: 24 }}>
        <Button type="primary" onClick={handleDownloadPDF}>
          📄 ดาวน์โหลด PDF ฉบับเต็ม
        </Button>
      </div>
    </div>
  );
}
