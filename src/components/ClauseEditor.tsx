import { Input, Button, Card, Divider, Popconfirm, Space } from "antd";
import type { Clause } from "../types/contract";

type Props = {
  clause: Clause;
  onChange: (clause: Clause) => void;
  onDelete: () => void;
};

export default function ClauseEditor({ clause, onChange, onDelete }: Props) {
  // ฟังก์ชันจัดข้อความให้อ่านง่าย
  const formatText = (text: string) => {
    return text
      .replace(/\s+/g, " ") // ลบช่องว่างซ้ำ
      .replace(/ ?([.,!?;:])/g, "$1") // ลบช่องว่างก่อนเครื่องหมาย
      .replace(/\n{2,}/g, "\n") // ลบบรรทัดว่างเกิน
      .trim();
  };

  const updateText = (index: number, value: string) => {
    const newBlocks = [...clause.blocks];
    const block = newBlocks[index];
    if (block.type === "text") {
      block.content = value;
      newBlocks[index] = block;
      onChange({ ...clause, blocks: newBlocks });
    }
  };

  const updateListItem = (
    blockIndex: number,
    itemIndex: number,
    value: string
  ) => {
    const newBlocks = [...clause.blocks];
    const block = newBlocks[blockIndex];
    if (block.type === "list" && Array.isArray(block.items)) {
      block.items[itemIndex] = value;
      newBlocks[blockIndex] = block;
      onChange({ ...clause, blocks: newBlocks });
    }
  };

  const deleteBlock = (blockIndex: number) => {
    const newBlocks = clause.blocks.filter((_, i) => i !== blockIndex);
    onChange({ ...clause, blocks: newBlocks });
  };

  const deleteListItem = (blockIndex: number, itemIndex: number) => {
    const newBlocks = [...clause.blocks];
    const block = newBlocks[blockIndex];
    if (block.type === "list" && Array.isArray(block.items)) {
      block.items.splice(itemIndex, 1);
      newBlocks[blockIndex] = block;
      onChange({ ...clause, blocks: newBlocks });
    }
  };

  const addListItem = (blockIndex: number) => {
    const newBlocks = [...clause.blocks];
    const block = newBlocks[blockIndex];
    if (block.type === "list" && Array.isArray(block.items)) {
      block.items.push("");
      newBlocks[blockIndex] = block;
      onChange({ ...clause, blocks: newBlocks });
    }
  };

  const addTextBlock = () => {
    onChange({
      ...clause,
      blocks: [...clause.blocks, { type: "text", content: "" }],
    });
  };

  const addListBlock = () => {
    onChange({
      ...clause,
      blocks: [...clause.blocks, { type: "list", items: [""] }],
    });
  };

  const formatAllText = () => {
    const formattedBlocks = clause.blocks.map((block) => {
      if (block.type === "text") {
        return { ...block, content: formatText(block.content || "") };
      } else if (block.type === "list" && Array.isArray(block.items)) {
        return { ...block, items: block.items.map((i) => formatText(i)) };
      }
      return block;
    });
    onChange({ ...clause, blocks: formattedBlocks });
  };

  return (
    <Card size="small" style={{ marginBottom: 16, borderRadius: 10 }}>
      <Input
        placeholder="หัวข้อข้อสัญญา"
        value={clause.title || ""}
        onChange={(e) => onChange({ ...clause, title: e.target.value })}
      />

      {clause.blocks.map((block, blockIndex) => (
        <div
          key={blockIndex}
          style={{
            marginTop: 10,
            padding: 10,
            border: "1px solid #f0f0f0",
            borderRadius: 8,
            background: "#fafafa",
          }}
        >
          {/* ย่อหน้า */}
          {block.type === "text" && (
            <>
              <Input.TextArea
                value={block.content}
                placeholder="เนื้อหาย่อหน้านี้"
                autoSize={{ minRows: 3, maxRows: 10 }}
                onChange={(e) => updateText(blockIndex, e.target.value)}
                style={{
                  textAlign: "justify",
                  lineHeight: 1.8,
                  fontSize: 14,
                  borderRadius: 6,
                  padding: "10px 12px",
                }}
              />
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                }}
              >
                <Button
                  size="small"
                  onClick={() => {
                    const newText = formatText(block.content);
                    updateText(blockIndex, newText);
                  }}
                >
                  จัดข้อความอัตโนมัติ
                </Button>
                <Popconfirm
                  title="ต้องการลบย่อหน้านี้ใช่ไหม?"
                  okText="ยืนยัน"
                  cancelText="ยกเลิก"
                  onConfirm={() => deleteBlock(blockIndex)}
                >
                  <Button danger size="small">
                    ลบย่อหน้านี้
                  </Button>
                </Popconfirm>
              </div>
            </>
          )}

          {block.type === "list" && (
            <>
              {block.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  style={{ display: "flex", gap: 6, marginTop: 4 }}
                >
                  <Input.TextArea
                    autoSize={{ minRows: 1, maxRows: 6 }}
                    value={item}
                    onChange={(e) =>
                      updateListItem(blockIndex, itemIndex, e.target.value)
                    }
                    style={{
                      flex: 1,
                      fontSize: 14,
                      borderRadius: 6,
                      padding: "8px 10px",
                      textAlign: "justify",
                      lineHeight: 1.8,
                    }}
                  />
                  <Popconfirm
                    title="ต้องการลบรายการนี้ใช่ไหม?"
                    okText="ยืนยัน"
                    cancelText="ยกเลิก"
                    onConfirm={() => deleteListItem(blockIndex, itemIndex)}
                  >
                    <Button danger size="small">
                      ลบ
                    </Button>
                  </Popconfirm>
                </div>
              ))}
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button
                    size="small"
                    type="dashed"
                    onClick={() => addListItem(blockIndex)}
                  >
                    + เพิ่มรายการย่อย
                  </Button>

                  <Button
                    size="small"
                    onClick={() => {
                      if (block.type === "list" && Array.isArray(block.items)) {
                        const newBlocks = [...clause.blocks];
                        const updatedBlock = {
                          ...block,
                          items: block.items.map((i) => formatText(i)),
                        };
                        newBlocks[blockIndex] = updatedBlock;
                        onChange({ ...clause, blocks: newBlocks });
                      }
                    }}
                  >
                    จัดข้อความอัตโนมัติ
                  </Button>
                </div>

                <Popconfirm
                  title="ต้องการลบส่วนนี้ทั้งหมดใช่ไหม?"
                  okText="ยืนยัน"
                  cancelText="ยกเลิก"
                  onConfirm={() => deleteBlock(blockIndex)}
                >
                  <Button danger size="small">
                    ลบส่วนนี้ทั้งหมด
                  </Button>
                </Popconfirm>
              </div>
            </>
          )}
        </div>
      ))}

      <Divider style={{ margin: "10px 0" }} />
      <Space wrap style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <Button size="small" type="primary" onClick={addTextBlock}>
            + เพิ่มย่อหน้า
          </Button>
          <Button
            size="small"
            type="dashed"
            style={{ marginLeft: 8 }}
            onClick={addListBlock}
          >
            + เพิ่มรายการ
          </Button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button size="small" onClick={formatAllText}>
            จัดข้อความทั้งหมด
          </Button>
          <Popconfirm
            title="ต้องการลบข้อสัญญานี้ทั้งหมดใช่ไหม?"
            okText="ยืนยัน"
            cancelText="ยกเลิก"
            onConfirm={onDelete}
          >
            <Button danger size="small">
              ลบข้อสัญญานี้ทั้งหมด
            </Button>
          </Popconfirm>
        </div>
      </Space>
    </Card>
  );
}
