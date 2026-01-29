// src/pages/admin/ContractEditor.tsx
import { useEffect, useMemo, useState } from "react";
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
  Space,
  Alert,
  Tooltip,
  DatePicker,
} from "antd";
import { UploadOutlined, SaveOutlined, MailOutlined } from "@ant-design/icons";
import { nanoid } from "nanoid";
import dayjs, { Dayjs } from "dayjs";

import ContractRenderer from "../../components/ContractRenderer";
import ClauseEditor from "../../components/ClauseEditor";
import { accountingTemplate } from "../../templates/accounting";
import type { ContractConfig, Clause, SignatureInfo } from "../../types/contract";

const { Title, Text } = Typography;

const REQUIRED_SIGNATURES: SignatureInfo[] = [
  {
    id: "sig-company-director",
    role: "company_director",
    name: "พี่แนน",
    position: "",
    inlineName: true,
  },
  {
    id: "sig-company-witness",
    role: "company_witness",
    name: "พี่เอ",
    position: "",
    inlineName: false,
  },
  {
    id: "sig-customer-director",
    role: "customer_director",
    name: "",
    position: "",
    inlineName: true,
  },
  {
    id: "sig-customer-witness",
    role: "customer_witness",
    name: "",
    position: "",
    inlineName: false,
  },
];

// helper: digits only
const digitsOnly = (s: string) => s.replace(/\D+/g, "");

// helper: Thai months + format/parse BE date
const TH_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const formatThaiDateBE = (d: Dayjs) => {
  const day = d.date();
  const month = TH_MONTHS[d.month()];
  const yearBE = d.year() + 543;
  return `${day} ${month} ${yearBE}`;
};

// รับ format: "1 สิงหาคม 2568" แล้วแปลงกลับเป็น dayjs (ค.ศ.)
const parseThaiDateBE = (s: string): Dayjs | null => {
  const raw = (s || "").trim();
  if (!raw) return null;

  const m = raw.match(/^(\d{1,2})\s+([^\s]+)\s+(\d{4})$/);
  if (!m) return null;

  const day = Number(m[1]);
  const monthName = m[2];
  const yearBE = Number(m[3]);

  const monthIdx = TH_MONTHS.indexOf(monthName);
  if (monthIdx < 0 || !Number.isFinite(day) || !Number.isFinite(yearBE))
    return null;

  const yearCE = yearBE - 543;
  const d = dayjs().year(yearCE).month(monthIdx).date(day);
  return d.isValid() ? d : null;
};

// ✅ กัน template/ข้อมูลจาก backend ที่อาจไม่มี fields บางตัว + กัน field ใหม่หาย
const normalizeConfig = (cfg: ContractConfig): ContractConfig => {
  return {
    ...cfg,
    partyA: {
      company: cfg.partyA?.company ?? "",
      taxId: cfg.partyA?.taxId ?? "",
      buildNo: cfg.partyA?.buildNo ?? "",
    },
    partyB: {
      company: cfg.partyB?.company ?? "",
      taxId: cfg.partyB?.taxId ?? "",
      buildNo: cfg.partyB?.buildNo ?? "",
    },
    clauses: Array.isArray(cfg.clauses) ? cfg.clauses : [],
    signatures: Array.isArray(cfg.signatures) ? cfg.signatures : [],
  };
};

const ensureSignatures = (cfg: ContractConfig): ContractConfig => {
  const safe = normalizeConfig(cfg);
  const current = safe.signatures || [];
  if (current.length === 4) return safe;

  return {
    ...safe,
    signatures: REQUIRED_SIGNATURES.map((s) => ({ ...s })),
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
  const [config, setConfig] = useState<ContractConfig>(() =>
    ensureSignatures(accountingTemplate),
  );

  // ✅ ให้ DatePicker โชว์ค่าตาม config.date (ไทย พ.ศ.)
  const [dateValue, setDateValue] = useState<Dayjs | null>(() =>
    parseThaiDateBE(accountingTemplate.date),
  );

  const [documentId, setDocumentId] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const [isDirty, setIsDirty] = useState(false);

  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // helper: setConfig แบบ mark dirty (ใช้กับการแก้ไขของ user เท่านั้น)
  const setConfigDirty = (
    next: ContractConfig | ((prev: ContractConfig) => ContractConfig),
  ) => {
    setConfig((prev) => (typeof next === "function" ? next(prev) : next));
    setIsDirty(true);
  };

  const apiBase = useMemo(() => {
    const v = import.meta.env.VITE_API_BASE_URL;
    return typeof v === "string" ? v.replace(/\/+$/, "") : "";
  }, []);

  useEffect(() => {
    const savedId = localStorage.getItem("lastDocumentId");
    if (!savedId) return;

    fetch(`${apiBase}/api/contracts/${savedId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.config) {
          const loaded = ensureSignatures(data.config as ContractConfig);
          setConfig(loaded);
          setDocumentId(savedId);
          setIsDirty(false);
          setDateValue(parseThaiDateBE(loaded.date)); // ✅ sync datepicker
          message.success("โหลดสัญญาล่าสุดเรียบร้อยแล้ว");
        }
      })
      .catch(() => message.error("โหลดสัญญาไม่สำเร็จ"));
  }, [apiBase]);

  const updateClause = (index: number, updated: Clause) => {
    setConfigDirty((prev) => {
      const safe = normalizeConfig(prev);
      const newClauses = [...safe.clauses];
      newClauses[index] = updated;
      return { ...safe, clauses: newClauses };
    });
  };

  const deleteClause = (id: string) => {
    setConfigDirty((prev) => {
      const safe = normalizeConfig(prev);
      return { ...safe, clauses: safe.clauses.filter((c) => c.id !== id) };
    });
  };

  const addTextClause = () => {
    setConfigDirty((prev) => {
      const safe = normalizeConfig(prev);
      return {
        ...safe,
        clauses: [
          ...safe.clauses,
          { id: nanoid(), blocks: [{ type: "text", content: "" }] },
        ],
      };
    });
  };

  const addListClause = () => {
    setConfigDirty((prev) => {
      const safe = normalizeConfig(prev);
      return {
        ...safe,
        clauses: [
          ...safe.clauses,
          { id: nanoid(), blocks: [{ type: "list", items: [""] }] },
        ],
      };
    });
  };

  const updateSignature = (
    index: number,
    field: keyof SignatureInfo,
    value: string | boolean,
  ) => {
    setConfigDirty((prev) => {
      const safe = ensureSignatures(prev);
      const newSigns = [...(safe.signatures || [])];
      if (!newSigns[index]) return safe;

      // SignatureInfo มี field เป็น optional อยู่แล้ว
      (newSigns[index] as SignatureInfo)[field] = value as never;
      return { ...safe, signatures: newSigns };
    });
  };

  const handleStampUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setConfigDirty((prev) => ({ ...prev, stamp: reader.result as string }));
    };
    reader.readAsDataURL(file);
    return false;
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${apiBase}/api/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: ensureSignatures(config) }),
      });

      const data = await res.json();
      if (!res.ok) {
        message.error("บันทึกสัญญาล้มเหลว: " + (data?.message || "unknown"));
        return;
      }

      setDocumentId(data.documentId);
      localStorage.setItem("lastDocumentId", data.documentId);
      setIsDirty(false);
      message.success("บันทึกสัญญาเรียบร้อยแล้ว");
    } catch {
      message.error("บันทึกสัญญาล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const canSend = !!documentId && !isDirty && !!email.trim() && !sending;

  const sendEmail = async () => {
    if (!documentId) return message.warning("กรุณากดบันทึกสัญญาก่อน");
    if (isDirty)
      return message.warning(
        "มีการแก้ไขที่ยังไม่ได้บันทึก กรุณากดบันทึกก่อนส่งอีเมล",
      );
    if (!email.trim()) return message.warning("กรุณากรอกอีเมล");

    try {
      setSending(true);
      const res = await fetch(`${apiBase}/api/send-sign-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), documentId }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) message.success("ส่งอีเมลเรียบร้อยแล้ว");
      else message.error("ส่งอีเมลไม่สำเร็จ: " + (data?.message || "unknown"));
    } finally {
      setSending(false);
    }
  };

  const statusTag = isDirty ? (
    <Tag color="red">ยังไม่ได้บันทึกล่าสุด</Tag>
  ) : (
    <Tag color="green">บันทึกแล้ว</Tag>
  );

  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        alignItems: "stretch",
        height: "100vh",
        overflow: "hidden",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 620,
          flex: "0 0 620px",
          height: "100%",
          overflow: "auto",
        }}
      >
        <Card
          title={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <b>แก้ไขสัญญา</b> <span style={{ marginLeft: 8 }}>{statusTag}</span>
              </div>
              <Space>
                <Tooltip
                  title={documentId ? `DocumentId: ${documentId}` : "ยังไม่เคยบันทึก"}
                >
                  <Tag color={documentId ? "blue" : "default"}>
                    {documentId ? "มีเลขเอกสาร" : "ยังไม่มีเลขเอกสาร"}
                  </Tag>
                </Tooltip>
              </Space>
            </div>
          }
          style={{ width: 620, borderRadius: 14 }}
          bodyStyle={{ paddingTop: 16 }}
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12, borderRadius: 12 }}
            message="ขั้นตอนแนะนำ"
            description={
              <div style={{ lineHeight: 1.8 }}>
                1) แก้ไขสัญญาให้เรียบร้อย → 2) กด <b>บันทึกสัญญา</b> → 3) กรอกอีเมล → 4) กด{" "}
                <b>ส่งอีเมลให้เซ็น</b>
                <br />
                <Text type="secondary">
                  *ระบบจะไม่ให้ส่งอีเมล ถ้ายังไม่ได้บันทึกล่าสุด เพื่อกันส่งข้อมูลเก่า
                </Text>
              </div>
            }
          />

          <Tabs
            defaultActiveKey="info"
            items={[
              {
                key: "info",
                label: "ข้อมูลสัญญา",
                children: (
                  <>
                    <Title level={5} style={{ marginTop: 0 }}>
                      ข้อมูลสัญญา
                    </Title>

                    <Space direction="vertical" size={10} style={{ width: "100%" }}>
                      <Input
                        placeholder="ชื่อสัญญา"
                        value={config.title}
                        onChange={(e) =>
                          setConfigDirty({ ...config, title: e.target.value })
                        }
                      />

                      {/* ✅ เลือกวันที่จริง + บันทึกเป็นไทย พ.ศ. */}
                      <DatePicker
                        style={{ width: "100%", borderRadius: 12, height: 40 }}
                        placeholder="เลือกวันที่"
                        format="DD/MM/YYYY"
                        value={dateValue}
                        onChange={(val) => {
                          setDateValue(val);
                          setConfigDirty({
                            ...config,
                            date: val ? formatThaiDateBE(val) : "",
                          });
                        }}
                        allowClear
                      />

                      <Input
                        placeholder="บริษัทผู้ว่าจ้าง"
                        value={config.partyA.company}
                        onChange={(e) =>
                          setConfigDirty({
                            ...config,
                            partyA: { ...config.partyA, company: e.target.value },
                          })
                        }
                      />

                      {/* ✅ บริษัทผู้รับจ้าง + เลข Build (ตัวเลขล้วน) อยู่บรรทัดเดียว */}
                      <Input
                        placeholder="บริษัทผู้รับจ้าง"
                        value={config.partyB.company}
                        onChange={(e) =>
                          setConfigDirty({
                            ...config,
                            partyB: { ...config.partyB, company: e.target.value },
                          })
                        }
                        addonAfter={
                          <Input
                            placeholder="Build"
                            value={config.partyB.buildNo ?? ""}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={10}
                            onChange={(e) => {
                              const onlyDigits = digitsOnly(e.target.value);
                              setConfigDirty({
                                ...config,
                                partyB: {
                                  ...config.partyB,
                                  buildNo: onlyDigits,
                                },
                              });
                            }}
                            style={{
                              width: 92,
                              border: "none",
                              boxShadow: "none",
                            }}
                          />
                        }
                      />

                      {/* ✅ เลขนิติบุคคลผู้รับจ้าง: ตัวเลขล้วน 13 หลัก */}
                      <Input
                        placeholder="เลขนิติบุคคล (ผู้รับจ้าง)"
                        value={config.partyB.taxId ?? ""}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={13}
                        showCount
                        onChange={(e) => {
                          const onlyDigits = digitsOnly(e.target.value);
                          setConfigDirty({
                            ...config,
                            partyB: { ...config.partyB, taxId: onlyDigits },
                          });
                        }}
                      />

                      <Text type="secondary" style={{ marginTop: -4 }}>
                        วันที่ในสัญญา: <b>{config.date || "-"}</b>
                      </Text>
                    </Space>
                  </>
                ),
              },
              {
                key: "clauses",
                label: "ข้อสัญญา",
                children: (
                  <>
                    <Divider style={{ marginTop: 6 }}>ข้อสัญญา</Divider>

                    {(config.clauses || []).map((clause, index) => (
                      <ClauseEditor
                        key={clause.id}
                        clause={clause}
                        onChange={(updated) => updateClause(index, updated)}
                        onDelete={() => deleteClause(clause.id)}
                      />
                    ))}

                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
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
                    <Divider style={{ marginTop: 6 }}>ตราประทับ</Divider>

                    <Space
                      align="start"
                      style={{ width: "100%", justifyContent: "space-between" }}
                    >
                      <Upload
                        accept="image/*"
                        showUploadList={false}
                        beforeUpload={handleStampUpload}
                      >
                        <Button icon={<UploadOutlined />}>อัปโหลดตราประทับ</Button>
                      </Upload>

                      {config.stamp ? (
                        <div style={{ textAlign: "right" }}>
                          <Text type="secondary">ตัวอย่างตราประทับ</Text>
                          <div>
                            <img
                              src={config.stamp}
                              alt="ตราประทับ"
                              style={{
                                width: 96,
                                height: 96,
                                marginTop: 6,
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "1px solid #eee",
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <Text type="secondary">ยังไม่ได้อัปโหลดตราประทับ</Text>
                      )}
                    </Space>

                    <Divider>ลายเซ็น (4 ช่องตายตัว)</Divider>

                    {ensureSignatures(config).signatures!.map((sign, index) => (
                      <Card
                        key={sign.id}
                        size="small"
                        style={{
                          marginBottom: 10,
                          background: "#fafafa",
                          borderRadius: 12,
                        }}
                        bodyStyle={{ paddingTop: 12 }}
                        title={
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <Tag color="blue">{displayRole(sign)}</Tag>

                            <Space size={10}>
                              <Text style={{ fontSize: 12, color: "#555" }}>
                                แสดงชื่อในบรรทัดลงชื่อ
                              </Text>
                              <Switch
                                checked={!!sign.inlineName}
                                onChange={(checked) =>
                                  updateSignature(index, "inlineName", checked)
                                }
                              />
                            </Space>
                          </div>
                        }
                      >
                        <Space direction="vertical" size={8} style={{ width: "100%" }}>
                          <Input
                            placeholder="ชื่อผู้ลงนาม"
                            value={sign.name}
                            onChange={(e) =>
                              updateSignature(index, "name", e.target.value)
                            }
                          />
                          <Input
                            placeholder="ตำแหน่ง"
                            value={sign.position}
                            onChange={(e) =>
                              updateSignature(index, "position", e.target.value)
                            }
                          />
                        </Space>

                        <div style={{ marginTop: 10, fontSize: 12, color: "#777" }}>
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
                    <Divider style={{ marginTop: 6 }}>บันทึก & ส่งอีเมล</Divider>

                    <Space direction="vertical" size={10} style={{ width: "100%" }}>
                      <Button
                        type="primary"
                        block
                        icon={<SaveOutlined />}
                        onClick={saveConfig}
                        loading={saving}
                        style={{ borderRadius: 12, height: 40 }}
                      >
                        บันทึกสัญญา
                      </Button>

                      {isDirty ? (
                        <Alert
                          type="warning"
                          showIcon
                          style={{ borderRadius: 12 }}
                          message="มีการแก้ไขที่ยังไม่ได้บันทึก"
                          description="ระบบจะไม่ให้ส่งอีเมลจนกว่าจะกดบันทึกล่าสุด เพื่อกันส่งเอกสารเวอร์ชันเก่า"
                        />
                      ) : (
                        <Alert
                          type="success"
                          showIcon
                          style={{ borderRadius: 12 }}
                          message="สถานะ: บันทึกแล้ว"
                          description="สามารถส่งอีเมลให้ผู้เซ็นได้ (เมื่อกรอกอีเมลครบ)"
                        />
                      )}

                      <Input
                        placeholder="อีเมลผู้เซ็นเอกสาร"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ borderRadius: 12, height: 40 }}
                      />

                      <Tooltip
                        title={
                          !documentId
                            ? "ต้องบันทึกสัญญาก่อน"
                            : isDirty
                            ? "มีการแก้ไขที่ยังไม่ได้บันทึก"
                            : !email.trim()
                            ? "กรุณากรอกอีเมล"
                            : ""
                        }
                      >
                        <Button
                          block
                          type="default"
                          icon={<MailOutlined />}
                          style={{ borderRadius: 12, height: 40 }}
                          onClick={sendEmail}
                          disabled={!canSend}
                          loading={sending}
                        >
                          ส่งอีเมลให้เซ็น
                        </Button>
                      </Tooltip>

                      {!documentId && (
                        <Tag color="orange" style={{ width: "fit-content" }}>
                          ยังไม่มีเลขเอกสาร: กรุณากด “บันทึกสัญญา” ก่อน
                        </Tag>
                      )}
                      {documentId && isDirty && (
                        <Tag color="red" style={{ width: "fit-content" }}>
                          แก้ไขแล้วแต่ยังไม่บันทึก: ต้องกด “บันทึกสัญญา” ก่อนส่งอีเมล
                        </Tag>
                      )}
                    </Space>
                  </>
                ),
              },
            ]}
          />
        </Card>
      </div>

      <div style={{ flex: 1, height: "100%", overflow: "auto", paddingRight: 8 }}>
        <Card
          title={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <b>Preview</b>
              {isDirty ? <Tag color="red">Unsaved changes</Tag> : <Tag color="green">Saved</Tag>}
            </div>
          }
          style={{ flex: 1, borderRadius: 14 }}
          bodyStyle={{ paddingTop: 16 }}
        >
          <ContractRenderer config={config} />
        </Card>
      </div>
    </div>
  );
}
