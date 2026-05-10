<style>
*{box-sizing:border-box;margin:0;padding:0}
.inv{background:#0f1117;border-radius:16px;padding:20px;font-family:var(--font-sans);color:#fff}
.inv-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
.inv-title{font-size:16px;font-weight:500}
.inv-sub{font-size:12px;color:rgba(255,255,255,0.4);margin-top:2px}
.btn-primary{padding:8px 16px;border-radius:10px;background:#5DCAA5;border:none;color:#04342C;font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px}
.btn-primary:hover{background:#1D9E75}
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
.stat{background:rgba(255,255,255,0.04);border:0.5px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px}
.stat-label{font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:6px}
.stat-val{font-size:18px;font-weight:500}
.filters{display:flex;gap:8px;margin-bottom:14px;align-items:center}
.filter-input{flex:1;background:rgba(255,255,255,0.05);border:0.5px solid rgba(255,255,255,0.1);border-radius:10px;padding:8px 12px 8px 34px;color:#fff;font-size:13px;outline:none}
.filter-input::placeholder{color:rgba(255,255,255,0.3)}
.fi-wrap{position:relative;flex:1}
.fi-wrap i{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.3);font-size:15px}
.filter-sel{background:rgba(255,255,255,0.05);border:0.5px solid rgba(255,255,255,0.1);border-radius:10px;padding:8px 12px;color:rgba(255,255,255,0.7);font-size:12px;outline:none;cursor:pointer}
.table-wrap{border-radius:12px;overflow:hidden;border:0.5px solid rgba(255,255,255,0.08)}
table{width:100%;border-collapse:collapse}
thead{background:rgba(255,255,255,0.04)}
th{padding:10px 14px;text-align:left;font-size:11px;color:rgba(255,255,255,0.4);font-weight:500;letter-spacing:0.04em;border-bottom:0.5px solid rgba(255,255,255,0.08)}
td{padding:11px 14px;font-size:12px;border-bottom:0.5px solid rgba(255,255,255,0.05)}
tr:last-child td{border-bottom:none}
tr:hover td{background:rgba(255,255,255,0.02)}
.prod-cell{display:flex;align-items:center;gap:10px}
.p-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px}
.p-name{font-size:13px;color:#fff}
.p-sku{font-size:10px;color:rgba(255,255,255,0.3);margin-top:1px}
.stock-bar-wrap{display:flex;align-items:center;gap:8px}
.stock-bar{height:5px;border-radius:3px;flex:1;background:rgba(255,255,255,0.08)}
.stock-fill{height:100%;border-radius:3px}
.stock-num{font-size:12px;min-width:24px}
.badge{padding:3px 9px;border-radius:20px;font-size:10px;font-weight:500;white-space:nowrap}
.b-ok{background:rgba(93,202,165,0.15);color:#5DCAA5}
.b-low{background:rgba(239,159,39,0.15);color:#EF9F27}
.b-out{background:rgba(240,149,149,0.15);color:#F09595}
.act-btns{display:flex;gap:6px}
.act-btn{padding:5px 10px;border-radius:7px;font-size:11px;cursor:pointer;border:0.5px solid rgba(255,255,255,0.1);background:transparent;color:rgba(255,255,255,0.5);transition:all 0.15s;display:flex;align-items:center;gap:3px}
.act-btn:hover{background:rgba(255,255,255,0.07);color:#fff}
</style>

<div class="inv">
  <div class="inv-top">
    <div>
      <div class="inv-title">Inventory</div>
      <div class="inv-sub">12 products · last updated just now</div>
    </div>
    <div style="display:flex;gap:8px">
      <button style="padding:8px 14px;border-radius:10px;background:rgba(255,255,255,0.05);border:0.5px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);font-size:13px;cursor:pointer;display:flex;align-items:center;gap:5px"><i class="ti ti-upload" style="font-size:14px"></i> Import</button>
      <button class="btn-primary" onclick="sendPrompt('Design the add product form for inventory')"><i class="ti ti-plus" style="font-size:14px"></i> Add product ↗</button>
    </div>
  </div>

  <div class="stats-row">
    <div class="stat"><div class="stat-label">Total products</div><div class="stat-val" style="color:#fff">12</div></div>
    <div class="stat"><div class="stat-label">In stock</div><div class="stat-val" style="color:#5DCAA5">9</div></div>
    <div class="stat"><div class="stat-label">Low stock</div><div class="stat-val" style="color:#EF9F27">2</div></div>
    <div class="stat"><div class="stat-label">Out of stock</div><div class="stat-val" style="color:#F09595">1</div></div>
  </div>

  <div class="filters">
    <div class="fi-wrap">
      <i class="ti ti-search"></i>
      <input class="filter-input" placeholder="Search products or SKU...">
    </div>
    <select class="filter-sel">
      <option>All categories</option>
      <option>Hot</option>
      <option>Cold</option>
      <option>Juice</option>
      <option>Energy</option>
    </select>
    <select class="filter-sel">
      <option>All stock</option>
      <option>In stock</option>
      <option>Low stock</option>
      <option>Out of stock</option>
    </select>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Category</th>
          <th>Price</th>
          <th style="min-width:140px">Stock level</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><div class="prod-cell"><div class="p-icon" style="background:#3C348922">☕</div><div><div class="p-name">Espresso</div><div class="p-sku">BEV-001</div></div></div></td>
          <td style="color:rgba(255,255,255,0.5)">Hot</td>
          <td style="color:#5DCAA5;font-weight:500">$2.50</td>
          <td><div class="stock-bar-wrap"><div class="stock-bar"><div class="stock-fill" style="width:80%;background:#5DCAA5"></div></div><span class="stock-num" style="color:#5DCAA5">24</span></div></td>
          <td><span class="badge b-ok">In stock</span></td>
          <td><div class="act-btns"><button class="act-btn"><i class="ti ti-edit" style="font-size:12px"></i> Edit</button><button class="act-btn"><i class="ti ti-plus" style="font-size:12px"></i> Restock</button></div></td>
        </tr>
        <tr>
          <td><div class="prod-cell"><div class="p-icon" style="background:#71291322">🍵</div><div><div class="p-name">Cappuccino</div><div class="p-sku">BEV-002</div></div></div></td>
          <td style="color:rgba(255,255,255,0.5)">Hot</td>
          <td style="color:#5DCAA5;font-weight:500">$4.25</td>
          <td><div class="stock-bar-wrap"><div class="stock-bar"><div class="stock-fill" style="width:60%;background:#5DCAA5"></div></div><span class="stock-num" style="color:#5DCAA5">18</span></div></td>
          <td><span class="badge b-ok">In stock</span></td>
          <td><div class="act-btns"><button class="act-btn"><i class="ti ti-edit" style="font-size:12px"></i> Edit</button><button class="act-btn"><i class="ti ti-plus" style="font-size:12px"></i> Restock</button></div></td>
        </tr>
        <tr>
          <td><div class="prod-cell"><div class="p-icon" style="background:#08504122">🧋</div><div><div class="p-name">Cold brew</div><div class="p-sku">BEV-003</div></div></div></td>
          <td style="color:rgba(255,255,255,0.5)">Cold</td>
          <td style="color:#5DCAA5;font-weight:500">$5.00</td>
          <td><div class="stock-bar-wrap"><div class="stock-bar"><div class="stock-fill" style="width:27%;background:#EF9F27"></div></div><span class="stock-num" style="color:#EF9F27">8</span></div></td>
          <td><span class="badge b-low">Low stock</span></td>
          <td><div class="act-btns"><button class="act-btn"><i class="ti ti-edit" style="font-size:12px"></i> Edit</button><button class="act-btn" style="border-color:rgba(239,159,39,0.3);color:#EF9F27"><i class="ti ti-plus" style="font-size:12px"></i> Restock</button></div></td>
        </tr>
        <tr>
          <td><div class="prod-cell"><div class="p-icon" style="background:#63380622">🥭</div><div><div class="p-name">Mango smoothie</div><div class="p-sku">BEV-007</div></div></div></td>
          <td style="color:rgba(255,255,255,0.5)">Juice</td>
          <td style="color:#5DCAA5;font-weight:500">$5.50</td>
          <td><div class="stock-bar-wrap"><div class="stock-bar"><div class="stock-fill" style="width:20%;background:#EF9F27"></div></div><span class="stock-num" style="color:#EF9F27">6</span></div></td>
          <td><span class="badge b-low">Low stock</span></td>
          <td><div class="act-btns"><button class="act-btn"><i class="ti ti-edit" style="font-size:12px"></i> Edit</button><button class="act-btn" style="border-color:rgba(239,159,39,0.3);color:#EF9F27"><i class="ti ti-plus" style="font-size:12px"></i> Restock</button></div></td>
        </tr>
        <tr>
          <td><div class="prod-cell"><div class="p-icon" style="background:#27500A22">⚡</div><div><div class="p-name">Monster energy</div><div class="p-sku">BEV-009</div></div></div></td>
          <td style="color:rgba(255,255,255,0.5)">Energy</td>
          <td style="color:#5DCAA5;font-weight:500">$4.00</td>
          <td><div class="stock-bar-wrap"><div class="stock-bar"><div class="stock-fill" style="width:0%;background:#F09595"></div></div><span class="stock-num" style="color:#F09595">0</span></div></td>
          <td><span class="badge b-out">Out of stock</span></td>
          <td><div class="act-btns"><button class="act-btn"><i class="ti ti-edit" style="font-size:12px"></i> Edit</button><button class="act-btn" style="border-color:rgba(240,149,149,0.3);color:#F09595"><i class="ti ti-plus" style="font-size:12px"></i> Restock</button></div></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>