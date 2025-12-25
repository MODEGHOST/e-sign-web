import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button, message } from "antd";
import ContractRenderer from "../../components/ContractRenderer";
import type { ContractConfig } from "../../types/contract";

export default function CompanySign() {
  const { documentId } = useParams();
  const [config, setConfig] = useState<ContractConfig | null>(null);
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [customerSignatures, setCustomerSignatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!documentId) return;

    // ดึงข้อมูลสัญญาจาก API ของสัญญา
    fetch(`http://localhost:4000/api/contracts/${documentId}`)
      .then((res) => res.json())
      .then((data) => {
        setConfig(data.config);
        setLoading(false);

        // เก็บลายเซ็นของลูกค้าไว้
        setCustomerSignatures(data.config.signatures); // ลายเซ็นลูกค้า
      })
      .catch((error) => {
        console.error("Error fetching contract data:", error);
        setLoading(false);
      });

    // ดึงลายเซ็นของลูกค้า
    fetch(`http://localhost:4000/api/contracts/${documentId}/signatures`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Received signatures from customer: ", data);
        // ตรวจสอบว่าได้ Base64 string จริงหรือไม่
        if (data.signatures && data.signatures.length > 0) {
          setCustomerSignatures((prevState) => [
            ...prevState,
            ...data.signatures,
          ]); // เพิ่มลายเซ็นที่ดึงจาก API
        }
      })
      .catch((error) => {
        console.error("Error fetching customer signatures:", error);
      });
  }, [documentId]);

  useEffect(() => {
    console.log("Customer Signatures:", customerSignatures); // ตรวจสอบค่าลายเซ็นของลูกค้า
  }, [customerSignatures]);

  const handleCompanySign = async () => {
    if (!Object.keys(signatures).length) {
      message.warning("กรุณาเซ็นก่อนยืนยัน ❗");
      return;
    }

    const res = await fetch(
      `http://localhost:4000/api/contracts/${documentId}/company-sign`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatures }),
      }
    );

    if (res.ok) {
      message.success("บริษัทเซ็นเอกสารสำเร็จ ✅");
    } else {
      message.error("เซ็นเอกสารไม่สำเร็จ ❌");
    }
  };

  if (loading || !config) return <div>กำลังโหลดเอกสาร...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* แสดงเอกสาร + ลายเซ็นลูกค้า (view) */}
      <ContractRenderer
        config={config}
        mode="edit"
        onSignedAll={(data) => {
          console.log("Received signatures from customer: ", data);
          setSignatures(data); // เก็บลายเซ็นจากบริษัท
        }}
        customerSignatures={customerSignatures} // ส่งลายเซ็นลูกค้าไปยัง ContractRenderer
      />

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Button type="primary" onClick={handleCompanySign}>
          🏢 บริษัทเซ็นและยืนยัน
        </Button>
      </div>
    </div>
  );
}
