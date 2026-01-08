// src/pages/admin/ContractEditor.tsx
import { useState, useEffect } from "react";
import {
  Input,
  Button,
  Card,
  Divider,
  message,
  Upload,
  Typography,
  Tabs,
  Switch,
  Tag,
} from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import ContractRenderer from "../../components/ContractRenderer";
import ClauseEditor from "../../components/ClauseEditor";
import { accountingTemplate } from "../../templates/accounting";
import type {
  ContractConfig,
  Clause,
  SignatureInfo,
} from "../../types/contract";

const { Title, Text } = Typography;

const REQUIRED_SIGNATURES: SignatureInfo[] = [
  {
    id: "sig-company-director",
    role: "company_director",
    name: "กรรมการบริษัท",
    position: "",
    inlineName: true,
  },
  {
    id: "sig-company-witness",
    role: "company_witness",
    name: "พยาน (บริษัท)",
    position: "",
    inlineName: false,
  },
  {
    id: "sig-customer-director",
    role: "customer_director",
    name: "กรรมการลูกค้า",
    position: "",
    inlineName: true,
  },
  {
    id: "sig-customer-witness",
    role: "customer_witness",
    name: "พยาน (ลูกค้า)",
    position: "",
    inlineName: false,
  },
];

const ensureSignatures = (cfg: ContractConfig): ContractConfig => {
  const current = cfg.signatures || [];

  // ถ้ามีครบ 4 แล้วก็ใช้ของเดิม
  if (current.length === 4) return cfg;

  // ถ้ามีเก่า/ไม่ครบ/มากกว่า ให้ "รีเซ็ตให้เป็นมาตรฐาน 4 ช่อง"
  return {
    ...cfg,
    signatures: REQUIRED_SIGNATURES.map((s) => ({
      ...s,
      // เผื่อมีค่าเดิมที่อยากคงไว้บางส่วน (optional)
      // ถ้าอยากคง name/position ของเดิม ให้หา match ตาม role แล้วแทนค่าได้
    })),
  };
};

const roleLabel = (role: string) => {
  switch (role) {
    case "company_director":
      return "กรรมการ (บริษัท)";
    case "company_witness":
      return "พยาน (บริษัท)";
    case "customer_director":
      return "กรรมการ (ลูกค้า)";
    case "customer_witness":
      return "พยาน (ลูกค้า)";
    default:
      return role;
  }
};

const displayRole = (sign: SignatureInfo) =>
  (sign.position?.trim() || "").length > 0
    ? sign.position!.trim()
    : roleLabel(sign.role);

export default function ContractEditor() {
  // ✅ ทำให้ template ได้ signatures ครบ 4 ตั้งแต่เริ่ม
  const [config, setConfig] = useState<ContractConfig>(() =>
    ensureSignatures(accountingTemplate)
  );

  const [documentId, setDocumentId] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const savedId = localStorage.getItem("lastDocumentId");
    if (!savedId) return;

    fetch(`http://localhost:4000/api/contracts/${savedId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          // ✅ โหลดแล้ว ensure ให้ครบ 4 ช่องด้วย
          setConfig(ensureSignatures(data.config));
          setDocumentId(savedId);
          message.success("โหลดสัญญาล่าสุดเรียบร้อยแล้ว");
        }
      })
      .catch(() => message.error("โหลดสัญญาไม่สำเร็จ"));
  }, []);

  const updateClause = (index: number, updated: Clause) => {
    const newClauses = [...config.clauses];
    newClauses[index] = updated;
    setConfig({ ...config, clauses: newClauses });
  };

  const deleteClause = (id: string) => {
    setConfig({
      ...config,
      clauses: config.clauses.filter((c) => c.id !== id),
    });
  };

  const addTextClause = () => {
    setConfig({
      ...config,
      clauses: [
        ...config.clauses,
        { id: crypto.randomUUID(), blocks: [{ type: "text", content: "" }] },
      ],
    });
  };

  const addListClause = () => {
    setConfig({
      ...config,
      clauses: [
        ...config.clauses,
        { id: crypto.randomUUID(), blocks: [{ type: "list", items: [""] }] },
      ],
    });
  };

  // ✅ updateSignature รองรับ string | boolean (เพื่อ inlineName)
  const updateSignature = (
    index: number,
    field: keyof SignatureInfo,
    value: string | boolean
  ) => {
    const newSigns = [...(config.signatures || [])];
    (newSigns[index] as any)[field] = value;
    setConfig({ ...config, signatures: newSigns });
  };

  const handleStampUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () =>
      setConfig({ ...config, stamp: reader.result as string });
    reader.readAsDataURL(file);
    return false;
  };

  const saveConfig = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ ensure อีกชั้นก่อนส่ง
        body: JSON.stringify({ config: ensureSignatures(config) }),
      });

      const data = await res.json();
      setDocumentId(data.documentId);
      localStorage.setItem("lastDocumentId", data.documentId);
      message.success("บันทึกสัญญาเรียบร้อยแล้ว");
    } catch {
      message.error("บันทึกสัญญาล้มเหลว");
    }
  };

  const sendEmail = async () => {
    if (!documentId) return message.warning("กรุณาบันทึกสัญญาก่อน");

    const res = await fetch(`http://localhost:4000/send-sign-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, documentId }),
    });

    const data = await res.json();
    if (res.ok) message.success("ส่งอีเมลเรียบร้อยแล้ว");
    else message.error("ส่งอีเมลไม่สำเร็จ: " + data.message);
  };

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      <Card title="แก้ไขสัญญา" style={{ width: 600, borderRadius: 10 }}>
        <Tabs
          defaultActiveKey="info"
          items={[
            {
              key: "info",
              label: "ข้อมูลสัญญา",
              children: (
                <>
                  <Title level={5}>ข้อมูลสัญญา</Title>
                  <Input
                    placeholder="ชื่อสัญญา"
                    value={config.title}
                    onChange={(e) =>
                      setConfig({ ...config, title: e.target.value })
                    }
                  />
                  <Input
                    style={{ marginTop: 8 }}
                    placeholder="วันที่"
                    value={config.date}
                    onChange={(e) =>
                      setConfig({ ...config, date: e.target.value })
                    }
                  />
                  <Input
                    style={{ marginTop: 8 }}
                    placeholder="บริษัทผู้ว่าจ้าง"
                    value={config.partyA.company}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        partyA: { ...config.partyA, company: e.target.value },
                      })
                    }
                  />
                  <Input
                    style={{ marginTop: 8 }}
                    placeholder="บริษัทผู้รับจ้าง"
                    value={config.partyB.company}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        partyB: { ...config.partyB, company: e.target.value },
                      })
                    }
                  />
                </>
              ),
            },
            {
              key: "clauses",
              label: "ข้อสัญญา",
              children: (
                <>
                  <Divider>ข้อสัญญา</Divider>
                  {config.clauses.map((clause, index) => (
                    <ClauseEditor
                      key={clause.id}
                      clause={clause}
                      onChange={(updated) => updateClause(index, updated)}
                      onDelete={() => deleteClause(clause.id)}
                    />
                  ))}
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <Button block onClick={addTextClause}>
                      + เพิ่มข้อแบบข้อความ
                    </Button>
                    <Button block onClick={addListClause} type="dashed">
                      + เพิ่มข้อแบบรายการ
                    </Button>
                  </div>
                </>
              ),
            },
            {
              key: "signatures",
              label: "ตราประทับ / ลายเซ็น",
              children: (
                <>
                  <Divider>ตราประทับ</Divider>
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleStampUpload}
                  >
                    <Button icon={<UploadOutlined />}>อัปโหลดตราประทับ</Button>
                  </Upload>

                  {config.stamp && (
                    <img
                      src={config.stamp}
                      alt="ตราประทับ"
                      style={{
                        width: 100,
                        height: 100,
                        marginTop: 10,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  )}

                  <Divider>ลายเซ็น (4 ช่องตายตัว)</Divider>
                  {(config.signatures || []).map((sign, index) => (
                    <Card
                      key={sign.id}
                      size="small"
                      style={{ marginBottom: 8, background: "#fafafa" }}
                      title={
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                          }}
                        >
                          <div>
                            <Tag color="blue">{displayRole(sign)}</Tag>
                          </div>

                          <div style={{ display: "flex", gap: 10 }}>
                            <Text style={{ fontSize: 12, color: "#555" }}>
                              แสดงชื่อในบรรทัดลงชื่อ
                            </Text>
                            <Switch
                              checked={!!sign.inlineName}
                              onChange={(checked) =>
                                updateSignature(index, "inlineName", checked)
                              }
                            />
                          </div>
                        </div>
                      }
                    >
                      {/* ❌ role ไม่ให้แก้เองแล้ว (กันชนกัน/มั่ว) */}
                      <Input
                        placeholder="ชื่อผู้ลงนาม"
                        value={sign.name}
                        onChange={(e) =>
                          updateSignature(index, "name", e.target.value)
                        }
                      />
                      <Input
                        style={{ marginTop: 6 }}
                        placeholder="ตำแหน่ง"
                        value={sign.position}
                        onChange={(e) =>
                          updateSignature(index, "position", e.target.value)
                        }
                      />

                      <div
                        style={{ marginTop: 8, fontSize: 12, color: "#777" }}
                      >
                        Preview บรรทัดลงชื่อ:{" "}
                        {sign.inlineName && sign.name ? (
                          <b>
                            (ลงชื่อ) .......... {sign.name} ..........{" "}
                            {displayRole(sign)}
                          </b>
                        ) : (
                          <b>
                            (ลงชื่อ)
                            ........................................................{" "}
                            {displayRole(sign)}
                          </b>
                        )}
                      </div>
                    </Card>
                  ))}
                </>
              ),
            },
            {
              key: "send",
              label: "ส่งเอกสาร",
              children: (
                <>
                  <Divider />
                  <Button type="primary" block onClick={saveConfig}>
                    บันทึกสัญญา
                  </Button>

                  <Input
                    placeholder="อีเมลผู้เซ็นเอกสาร"
                    style={{ marginTop: 8 }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <Button
                    block
                    type="default"
                    style={{ marginTop: 8 }}
                    onClick={sendEmail}
                  >
                    ส่งอีเมลให้เซ็น
                  </Button>
                </>
              ),
            },
          ]}
        />
      </Card>

      <Card title="Preview" style={{ flex: 1, borderRadius: 10 }}>
        <ContractRenderer config={config} />
      </Card>
    </div>
  );
}
