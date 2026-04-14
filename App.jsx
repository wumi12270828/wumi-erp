import React, { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, PlusCircle } from "lucide-react";

const priceTable = {
  PVC: 500,
  PP: 400,
  合成板: 800,
  店卡: 20,
  DM: 5,
  "PVC裱合成板": 1200,
  割型: 1500,
  設計: 1000,
  施工: 2000,
};

const categoryOptions = {
  校園佈置: ["PVC", "PP", "合成板"],
  商業廣告: ["店卡", "DM"],
  會場佈置: ["PVC裱合成板", "割型"],
  婚禮佈置: ["設計", "施工"],
};

function newItem() {
  return {
    id: crypto.randomUUID(),
    category: "",
    product: "",
    width: "",
    height: "",
    qty: "1",
    adjust: "0",
  };
}

function calcBase(item) {
  const w = Number(item.width) || 0;
  const h = Number(item.height) || 0;
  const q = Number(item.qty) || 0;
  const unit = priceTable[item.product] || 0;
  return w && h ? w * h * unit * q : unit * q;
}

function calcItem(item) {
  const base = calcBase(item);
  const adjust = Number(item.adjust) || 0;
  return Math.round(base * (1 + adjust / 100));
}

export default function App() {
  const [mode, setMode] = useState("業務");
  const [customer, setCustomer] = useState("");
  const [contact, setContact] = useState("");
  const [tel, setTel] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [lineId, setLineId] = useState("");
  const [items, setItems] = useState([newItem()]);
  const [quoteHistory, setQuoteHistory] = useState([]);

  const quoteRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("wumi_quotes");
    if (saved) setQuoteHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("wumi_quotes", JSON.stringify(quoteHistory));
  }, [quoteHistory]);

  const total = useMemo(() => items.reduce((sum, item) => sum + calcItem(item), 0), [items]);
  const totalRevenue = quoteHistory
    .filter((q) => q.status === "已成交")
    .reduce((sum, q) => sum + q.total, 0);

  const updateItem = (id, key, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, [key]: value };
        if (key === "category") next.product = "";
        return next;
      })
    );
  };

  const addItem = () => setItems((prev) => [...prev, newItem()]);

  const saveQuote = () => {
    const newQuote = {
      id: Date.now(),
      customer,
      contact,
      tel,
      mobile,
      email,
      lineId,
      total,
      date: new Date().toISOString(),
      status: "報價中",
    };
    setQuoteHistory((prev) => [newQuote, ...prev]);
    alert("已儲存報價");
  };

  const markDone = (id) => {
    setQuoteHistory((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: "已成交" } : q))
    );
  };

  const exportImage = async () => {
    if (!quoteRef.current) return;
    const dataUrl = await toPng(quoteRef.current, { cacheBust: true, pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = `報價單_${customer || "未命名客戶"}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>無名美工報價系統</h1>
        <div className="mode-switch">
          <button
            className={mode === "業務" ? "btn btn-primary" : "btn btn-outline"}
            onClick={() => setMode("業務")}
          >
            業務模式
          </button>
          <button
            className={mode === "老闆" ? "btn btn-primary" : "btn btn-outline"}
            onClick={() => setMode("老闆")}
          >
            老闆模式
          </button>
        </div>
      </header>

      {mode === "業務" && (
        <>
          <section className="card">
            <div className="card-title">快速報價</div>
            <div className="card-body">
              <input className="input" placeholder="客戶名稱" value={customer} onChange={(e) => setCustomer(e.target.value)} />
              <input className="input" placeholder="聯絡人" value={contact} onChange={(e) => setContact(e.target.value)} />
              <div className="grid-2">
                <input className="input" placeholder="市話" value={tel} onChange={(e) => setTel(e.target.value)} />
                <input className="input" placeholder="行動電話" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>
              <div className="grid-2">
                <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input className="input" placeholder="LINE" value={lineId} onChange={(e) => setLineId(e.target.value)} />
              </div>
            </div>
          </section>

          {items.map((item, idx) => (
            <section className="card" key={item.id}>
              <div className="card-title">明細 {idx + 1}</div>
              <div className="card-body">
                <select className="input" value={item.category} onChange={(e) => updateItem(item.id, "category", e.target.value)}>
                  <option value="">選擇大分類</option>
                  {Object.keys(categoryOptions).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select className="input" value={item.product} onChange={(e) => updateItem(item.id, "product", e.target.value)}>
                  <option value="">選擇細項</option>
                  {(categoryOptions[item.category] || []).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                <div className="grid-3">
                  <input className="input" placeholder="寬" value={item.width} onChange={(e) => updateItem(item.id, "width", e.target.value)} />
                  <input className="input" placeholder="高" value={item.height} onChange={(e) => updateItem(item.id, "height", e.target.value)} />
                  <input className="input" placeholder="數量" value={item.qty} onChange={(e) => updateItem(item.id, "qty", e.target.value)} />
                </div>

                <div className="muted">單價：{priceTable[item.product] || 0}</div>
                <div className="muted">小計：NT$ {Math.round(calcBase(item)).toLocaleString()}</div>

                <input
                  className="input"
                  placeholder="加成 / 折扣 %（例如 10 或 -10）"
                  value={item.adjust}
                  onChange={(e) => updateItem(item.id, "adjust", e.target.value)}
                />

                <div className="quick-actions">
                  <button className="btn btn-outline btn-small" type="button" onClick={() => updateItem(item.id, "adjust", "10")}>+10%</button>
                  <button className="btn btn-outline btn-small" type="button" onClick={() => updateItem(item.id, "adjust", "20")}>+20%</button>
                  <button className="btn btn-outline btn-small" type="button" onClick={() => updateItem(item.id, "adjust", "-10")}>-10%</button>
                  <button className="btn btn-ghost btn-small" type="button" onClick={() => updateItem(item.id, "adjust", "0")}>清除</button>
                </div>

                <div className="subtotal">調整後：NT$ {calcItem(item).toLocaleString()}</div>
              </div>
            </section>
          ))}

          <button className="btn btn-outline full" onClick={addItem}>
            <PlusCircle size={18} />
            新增明細
          </button>

          <div className="grand-total">總計 NT$ {total.toLocaleString()}</div>

          <button className="btn btn-primary full" onClick={saveQuote}>儲存報價</button>
        </>
      )}

      {mode === "老闆" && (
        <>
          <section className="card">
            <div className="card-title">老闆控制台</div>
            <div className="card-body">
              <div>總營收：NT$ {totalRevenue.toLocaleString()}</div>
              <div>成交數：{quoteHistory.filter((q) => q.status === "已成交").length}</div>
            </div>
          </section>

          <section className="card">
            <div className="card-title">報價紀錄</div>
            <div className="card-body list">
              {quoteHistory.length === 0 && <div className="muted">目前沒有資料</div>}
              {quoteHistory.map((q) => (
                <div className="list-row" key={q.id}>
                  <div>
                    <div className="row-title">{q.customer || "未命名客戶"}</div>
                    <div className="muted">NT$ {q.total.toLocaleString()}</div>
                  </div>
                  <div className="row-actions">
                    <span className={q.status === "已成交" ? "status success" : "status"}>{q.status}</span>
                    {q.status !== "已成交" && (
                      <button className="btn btn-small btn-outline" onClick={() => markDone(q.id)}>成交</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="quote-preview" ref={quoteRef}>
        <div className="company">無名美工創意有限公司</div>
        <div>客戶：{customer || "—"}</div>
        <div>聯絡人：{contact || "—"}</div>
        <div>市話：{tel || "—"} ｜ 行動：{mobile || "—"}</div>
        <div>Email：{email || "—"} ｜ LINE：{lineId || "—"}</div>
        <div className="preview-total">總金額：NT$ {total.toLocaleString()}</div>
      </section>

      <button className="btn btn-outline full" onClick={exportImage}>
        <Download size={18} />
        下載報價單圖片
      </button>
    </div>
  );
}
