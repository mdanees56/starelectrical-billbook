
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Plus, Search, X } from 'lucide-react'
import { finalizeSale, save } from '../services/db'
import { downloadInvoice } from '../services/pdfService'
import { emptyCustomer, emptyProduct, money, today } from '../utils/appHelpers'
import { Empty, Modal, Panel } from '../components/ui'
export default function CreateBill({api}) {
  const nav=useNavigate(); const [customerId,setCustomerId]=useState(''),[items,setItems]=useState([]),[finder,setFinder]=useState(''),[received,setReceived]=useState(0),[method,setMethod]=useState('Cash'),[discount,setDiscount]=useState(0),[additional,setAdditional]=useState(0),[addingProduct,setAddingProduct]=useState(false)
  const customer=api.customers.find(c=>c.id===customerId); const previous=Number(api.outstanding[customerId]||0)
  const current=useMemo(()=>{const subtotal=items.reduce((n,x)=>n+Number(x.quantity)*Number(x.rate),0);const gst=items.reduce((n,x)=>n+Number(x.quantity)*Number(x.rate)*(1-Number(x.discount||0)/100)*Number(x.gst||0)/100,0);const lineDiscount=items.reduce((n,x)=>n+Number(x.quantity)*Number(x.rate)*Number(x.discount||0)/100,0);const exact=subtotal-lineDiscount-Number(discount||0)+gst+Number(additional||0);return {subtotal,gst,discount:lineDiscount+Number(discount||0),additional:Number(additional||0),rounding:Math.round(exact)-exact,grand:Math.round(exact)}},[items,discount,additional]); const totalPayable=previous+current.grand; const balance=Math.max(0,totalPayable-Number(received||0));
  const add=p=>{if(items.some(x=>x.productId===p.id))return api.notify('Product already added.');setItems([...items,{id:crypto.randomUUID(),productId:p.id,name:p.name,sku:p.sku,unit:p.unit,quantity:1,rate:p.sellingPrice,gst:p.gst||0,discount:0}]);setFinder('')}; const patch=(id,key,value)=>setItems(items.map(i=>i.id===id?{...i,[key]:value}:i));
  const saveBill=async()=>{if(!items.length)return alert('Add at least one item.');if(Number(received)<0||Number(received)>totalPayable)return alert('Received amount cannot exceed total payable.');const status=Number(received)===0?'Unpaid':Number(received)>=totalPayable?'Paid':'Partial';const bill={invoiceNo:`${api.settings.invoicePrefix}${String(api.settings.nextInvoice).padStart(3,'0')}`,date:today(),invoiceType:api.settings.invoiceType,customerId,customer:customer||{...emptyCustomer},items,overallDiscount:discount,additional,received:Number(received),paymentMethod:method,paymentStatus:status};try{const finalized=await finalizeSale(bill,current);if(!finalized){for(const i of items.filter(x=>x.productId)){const p=api.products.find(x=>x.id===i.productId);if(p)await save('products',{...p,stock:Math.max(0,Number(p.stock)-Number(i.quantity))})}}await downloadInvoice({...bill,total:totalPayable},api.settings,{...current,grand:totalPayable});api.updateSettings({...api.settings,nextInvoice:Number(api.settings.nextInvoice)+1});await api.reload();api.notify('Invoice saved and outstanding updated.');nav('/')}catch(e){alert(e.message)}}
  const matches=api.products.filter(p=>finder&&`${p.name} ${p.sku}`.toLowerCase().includes(finder.toLowerCase())).slice(0,8)
  return <section><div className="page-title"><div><h1>Create new bill</h1><p>Selecting a customer automatically adds their previous outstanding to total payable.</p></div></div><div className="bill-grid"><div><Panel title="Invoice & customer"><div className="form-grid compact"><label>Saved customer<select value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Walk-in customer</option>{api.customers.map(c=><option key={c.id} value={c.id}>{c.name} {c.mobile&&`(${c.mobile})`}</option>)}</select></label><label>Customer name<input value={customer?.name||''} readOnly placeholder="Walk-in customer"/></label><label>Mobile<input value={customer?.mobile||''} readOnly/></label><label>Address<input value={customer?.address||''} readOnly/></label></div></Panel><Panel title="Items"><div className="product-finder"><Search size={17}/><input value={finder} onChange={e=>setFinder(e.target.value)} placeholder="Search inventory by name or code"/>{matches.length>0&&<div className="suggestions">{matches.map(p=><button key={p.id} onClick={()=>add(p)}><b>{p.name}</b><span>{money(p.sellingPrice)} · {p.stock} left</span></button>)}</div>}</div><button type="button" className="secondary add-custom" onClick={()=>setAddingProduct(true)}><Plus size={16}/> Add new product to inventory</button><div className="table-wrap invoice-table"><table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>GST%</th><th>Amount</th><th></th></tr></thead><tbody>{items.map(i=><tr key={i.id}><td><b>{i.name}</b><small>{i.unit}</small></td><td><input type="number" min="1" value={i.quantity} onChange={e=>patch(i.id,'quantity',e.target.value)}/></td><td><input type="number" min="0" value={i.rate} onChange={e=>patch(i.id,'rate',e.target.value)}/></td><td><input type="number" min="0" value={i.gst} onChange={e=>patch(i.id,'gst',e.target.value)}/></td><td>{money(Number(i.quantity)*Number(i.rate))}</td><td><button className="icon danger" onClick={()=>setItems(items.filter(x=>x.id!==i.id))}><X size={16}/></button></td></tr>)}{!items.length&&<tr><td colSpan="6"><Empty text="Search and add products."/></td></tr>}</tbody></table></div></Panel></div><div><Panel title="Bill summary"><div className="summary"><label>Overall discount (₹)<input type="number" min="0" value={discount} onChange={e=>setDiscount(e.target.value)}/></label><label>Additional charges (₹)<input type="number" min="0" value={additional} onChange={e=>setAdditional(e.target.value)}/></label><label>Received amount (₹)<input type="number" min="0" max={totalPayable} value={received} onChange={e=>setReceived(e.target.value)}/></label><label>Payment method<select value={method} onChange={e=>setMethod(e.target.value)}><option>Cash</option><option>UPI</option><option>Bank Transfer</option></select></label><hr/><div><span>Previous outstanding</span><b>{money(previous)}</b></div><div><span>Current bill subtotal</span><b>{money(current.subtotal)}</b></div><div><span>Discount</span><b>− {money(current.discount)}</b></div><div><span>GST</span><b>{money(current.gst)}</b></div><div><span>Additional charges</span><b>{money(current.additional)}</b></div><div className="grand"><span>Total payable</span><b>{money(totalPayable)}</b></div><div><span>Balance due</span><b>{money(balance)}</b></div></div><button className="wide" onClick={saveBill}><Download size={18}/> Save & download PDF</button></Panel></div></div>{addingProduct&&<NewBillProductModal products={api.products} close={()=>setAddingProduct(false)} onSaved={async product=>{await api.reload();add(product);setAddingProduct(false)}}/>}</section>
}

function NewBillProductModal({products,close,onSaved}) {
  const [form,setForm]=useState({...emptyProduct})
  const [busy,setBusy]=useState(false)

  const submit=async event=>{
    event.preventDefault()
    const name=form.name.trim()
    const price=Number(form.sellingPrice)
    const stock=Number(form.stock)
    if(!name)return alert('Product name is required.')
    if(!Number.isFinite(price)||price<0)return alert('Enter a valid selling price.')
    if(!Number.isFinite(stock)||stock<1)return alert('Initial stock must be at least 1 so this product can be added to the bill.')
    const duplicate=products.find(product=>product.name.trim().toLowerCase()===name.toLowerCase()||(form.sku&&product.sku?.trim().toLowerCase()===form.sku.trim().toLowerCase()))
    if(duplicate)return alert('A product with that name or product code already exists. Search for it and add it from inventory.')

    setBusy(true)
    try {
      const product={
        ...form,
        id:crypto.randomUUID(),
        name,
        sellingPrice:price,
        purchasePrice:Number(form.purchasePrice||0),
        gst:Number(form.gst||0),
        stock,
        lowStock:Number(form.lowStock||5),
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString(),
      }
      await save('products',product)
      await onSaved(product)
    } catch(error) {
      alert(error.message)
    } finally {
      setBusy(false)
    }
  }

  const field=(label,key,type='text',props={})=><label>{label}<input
    type={type}
    value={form[key]??''}
    onChange={event=>setForm({...form,[key]:event.target.value})}
    {...props}
  /></label>

  return <Modal title="Add product to inventory" close={close}>
    <form className="form-grid" onSubmit={submit}>
      {field('Product name *','name','text',{autoFocus:true,required:true})}
      {field('Product code / SKU','sku')}
      <label>Unit<select value={form.unit} onChange={event=>setForm({...form,unit:event.target.value})}>
        {['PCS','MTR','ROLL','BOX','SET','KG'].map(unit=><option key={unit}>{unit}</option>)}
      </select></label>
      {field('Selling price *','sellingPrice','number',{min:'0',step:'0.01',required:true})}
      {field('GST %','gst','number',{min:'0',max:'100',step:'0.01'})}
      {field('Initial stock *','stock','number',{min:'1',step:'1',required:true})}
      <div className="form-actions full">
        <button type="button" className="secondary" onClick={close}>Cancel</button>
        <button disabled={busy}>{busy?'Saving…':'Save product & add to bill'}</button>
      </div>
    </form>
  </Modal>
}
