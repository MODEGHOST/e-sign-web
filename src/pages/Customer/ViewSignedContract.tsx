import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Button, message } from "antd";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ContractRenderer from "../../components/ContractRenderer";
import type { ContractConfig } from "../../types/contract";

export default function ViewSignedContract() {
  const { documentId } = useParams();
  const [config, setConfig] = useState<ContractConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  // ✅ โหลดสัญญาฉบับที่เซ็นครบแล้ว
  useEffect(() => {
    if (documentId) {
      setLoading(true);
      fetch(`http://localhost:4000/api/contracts/${documentId}`)
        .then((res) => {
          if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลสัญญาได้");
          return res.json();
        })
        .then((data) => {
          setConfig(data.config);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [documentId]);

  // ✅ ดาวน์โหลด PDF ฉบับจริง
  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
      pdf.save(`${config?.title || "contract"}.pdf`);
      message.success("✅ ดาวน์โหลด PDF เรียบร้อยแล้ว");
    } catch (err) {
      message.error("❌ เกิดข้อผิดพลาดระหว่างสร้าง PDF");
    }
  };

  if (loading) return <div>กำลังโหลดเอกสาร...</div>;
  if (error) return <div>เกิดข้อผิดพลาด: {error}</div>;
  if (!config) return null;

  return (
    <div style={{ margin: "0 auto", maxWidth: 900 }}>
      {/* แสดงเอกสารเต็ม */}
      <div ref={pdfRef}>
        <ContractRenderer config={config} mode="view" />
      </div>

      {/* ปุ่มดาวน์โหลด PDF */}
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Button type="primary" onClick={handleDownloadPDF}>
          📄 ดาวน์โหลด PDF ฉบับเต็ม
        </Button>
      </div>
    </div>
  );
}
