import {useState} from 'react'
import {Download, Pencil, Plus, Search, Trash2} from 'lucide-react'
import {normalizeLabel, remove, save} from '../services/db'
import {emptyProduct, money} from '../utils/appHelpers'
import {Empty, Modal} from '../components/ui'

export default function Products({api}) {
    const [query,
            setQuery] = useState(''),
        [category, setCategory] = useState(''),
        [editing, setEditing] = useState(null);
    const categories = [...new Map(api.products.filter(p => p.category).map(p => [
            normalizeLabel(p.category),
            p
                .category
                .trim()
        ])).values()];
    const filtered = api
        .products
        .filter(p => (`${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase())) && (!category || normalizeLabel(p.category) === normalizeLabel(category)));
    const erase = async p => {
        if (confirm(`Delete ${p.name}? This cannot be used in future bills.`)) {
            await remove('products', p.id);
            api.reload();
            api.notify('Product deleted.')
        }
    };
    const exportCsv = () => {
        const headers = Object.keys(emptyProduct);
        const csv = [
            headers.join(','),
            ...api
                .products
                .map(p => headers.map(h => `"${String(p[h] ?? '').replaceAll('"', '""')}"`).join(','))
        ].join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'}));
        a.download = 'star-electrical-products.csv';
        a.click()
    };
    return <section>
        <div className="page-title">
            <div>
                <h1>Products & inventory</h1>
                <p>Prices and stock here are used for every new bill.</p>
            </div>
            <div className="actions">
                <button className="secondary" onClick={exportCsv}><Download size={17}/>
                    CSV</button>
                <button onClick={() => setEditing(emptyProduct)}><Plus size={17}/>
                    Add product</button>
            </div>
        </div>
        <div className="toolbar">
            <label className="search"><Search size={17}/><input
                placeholder="Search name or product code"
                value={query}
                onChange={e => setQuery(e.target.value)}/></label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">All categories</option>{categories.map(c => <option key={normalizeLabel(c)} value={c}>{c}</option>)}</select>
        </div>
        <div className="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Code</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>{filtered.map(p => <tr key={p.id}>
                        <td>
                            <b>{p.name}</b>
                            <small>{p.brand || 'No brand'}
                                · {p.unit}</small>
                        </td>
                        <td>{p.sku || '—'}</td>
                        <td>{p.category || '—'}</td>
                        <td>{money(p.sellingPrice)}
                            <small>GST {p.gst || 0}%</small>
                        </td>
                        <td>
                            <span
                                className={Number(p.stock) <= Number(p.lowStock ?? api.settings.lowStockThreshold)
                                ? 'badge red'
                                : 'badge'}>{p.stock} {p.unit}</span>
                        </td>
                        <td className="row-actions">
                            <button onClick={() => setEditing(p)} aria-label="Edit"><Pencil size={16}/></button>
                            <button onClick={() => erase(p)} aria-label="Delete"><Trash2 size={16}/></button>
                        </td>
                    </tr>)}{!filtered.length && <tr>
                        <td colSpan="6"><Empty text="No products match the search."/></td>
                    </tr>}</tbody>
            </table>
        </div>{editing && <ProductModal
            product={editing}
            products={api.products}
            close={() => setEditing(null)}
            done={api.reload}
            notify={api.notify}/>}</section>
}
function ProductModal({product, products, close, done, notify}) {
    const [form,
        setForm] = useState(product);
    const field = (label, key, type = 'text') => <label>{label}<input
        type={type}
        value={form[key] ?? ''}
        onChange={e => setForm({
        ...form,
        [key]: e.target.value
    })}/></label>;
    const submit = async e => {
        e.preventDefault();
        if (!form.name.trim()) 
            return alert('Product name is required.');
        if (!form.sellingPrice && form.sellingPrice !== 0) 
            return alert('Selling price is required.');
        const dup = products.find(p => p.id !== form.id && (p.name.trim().toLowerCase() === form.name.trim().toLowerCase() || (form.sku && p.sku.toLowerCase() === form.sku.toLowerCase())));
        if (dup) 
            return alert('A product with that name or product code already exists.');
        await save('products', {
            ...form,
            id: form.id || crypto.randomUUID(),
            name: form
                .name
                .trim(),
            sellingPrice: Number(form.sellingPrice),
            stock: Number(form.stock || 0),
            gst: Number(form.gst || 0),
            lowStock: Number(form.lowStock || 5),
            updatedAt: new Date().toISOString()
        });
        await done();
        notify('Product saved.');
        close()
    };
    return <Modal
        title={product.id
        ? 'Edit product'
        : 'Add product'}
        close={close}>
        <form className="form-grid" onSubmit={submit}>{field('Product name *', 'name')} {field('Product code / SKU', 'sku')}
            {field('Category', 'category')}
            {field('Brand', 'brand')}<label>Unit<select
                value={form.unit}
                onChange={e => setForm({
        ...form,
        unit: e.target.value
    })}>{[
                        'PCS',
                        'MTR',
                        'ROLL',
                        'BOX',
                        'SET',
                        'KG'
                    ].map(x => <option key={x}>{x}</option>)}</select>
            </label>{field('Selling price *', 'sellingPrice', 'number')}{field('Purchase price', 'purchasePrice', 'number')}{field('GST %', 'gst', 'number')}{field('Available stock', 'stock', 'number')}{field('Low-stock alert', 'lowStock', 'number')}
            <label className="full">Description<textarea
                value={form.description || ''}
                onChange={e => setForm({
        ...form,
        description: e.target.value
    })}/></label>
            <div className="form-actions full">
                <button type="button" className="secondary" onClick={close}>Cancel</button>
                <button>Save product</button>
            </div>
        </form>
    </Modal>
}
