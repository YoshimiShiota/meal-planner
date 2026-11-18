// 初期サンプルデータ
const defaultRecipes = [
    {
        id: 'r1',
        name: '特製カレーライス',
        ingredients: [
            { name: '豚肉', amount: 300, unit: 'g', category: '肉・魚' },
            { name: '玉ねぎ', amount: 2, unit: '個', category: '野菜' },
            { name: 'じゃがいも', amount: 3, unit: '個', category: '野菜' },
            { name: 'にんじん', amount: 1, unit: '本', category: '野菜' },
            { name: 'カレールー', amount: 1, unit: '箱', category: '調味料・その他' }
        ]
    },
    {
        id: 'r2',
        name: '豚の生姜焼き',
        ingredients: [
            { name: '豚ロース薄切り', amount: 350, unit: 'g', category: '肉・魚' },
            { name: 'キャベツ', amount: 0.3, unit: '個', category: '野菜' },
            { name: '玉ねぎ', amount: 0.5, unit: '個', category: '野菜' },
            { name: '生姜チューブ', amount: 1, unit: '本', category: '調味料・その他' }
        ]
    }
];

const days = ['月', '火', '水', '木', '金', '土', '日'];

let recipes = JSON.parse(localStorage.getItem('md_recipes')) || defaultRecipes;
let weeklyMenu = JSON.parse(localStorage.getItem('md_weekly')) || { '月': 'r1', '火': 'r2', '水': 'r1', '木': 'r2', '金': 'r1', '土': 'r2', '日': 'r1' };
let settings = JSON.parse(localStorage.getItem('md_settings')) || { adults: 2, children: 1, ngItems: 'ピーマン, セロリ, 辛いもの', ngFilter: true };
let checkedItems = JSON.parse(localStorage.getItem('md_checked')) || {};

function saveData() {
    localStorage.setItem('md_recipes', JSON.stringify(recipes));
    localStorage.setItem('md_weekly', JSON.stringify(weeklyMenu));
    localStorage.setItem('md_settings', JSON.stringify(settings));
    localStorage.setItem('md_checked', JSON.stringify(checkedItems));
}

function switchTab(e, tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    e.currentTarget.classList.add('active');
    if(tabId === 'shopping') renderShoppingList();
}

window.onload = function() {
    syncSettingsUI();
    renderWeeklyCalendar();
    renderRecipeList();
};

function syncSettingsUI() {
    document.getElementById('adult-count').value = settings.adults;
    document.getElementById('child-count').value = settings.children;
    document.getElementById('ng-ingredients').value = settings.ngItems;
    document.getElementById('ng-filter').checked = settings.ngFilter;
}

function saveSettings() {
    settings.adults = parseInt(document.getElementById('adult-count').value) || 1;
    settings.children = parseInt(document.getElementById('child-count').value) || 0;
    settings.ngItems = document.getElementById('ng-ingredients').value;
    settings.ngFilter = document.getElementById('ng-filter').checked;
    saveData();
}

function exportBackupFile() {
    const backupData = { version: 1, exportedAt: new Date().toISOString(), recipes, weeklyMenu, settings, checkedItems };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menu_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importBackupFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.recipes) throw new Error();
            if (!confirm('データを復元して上書きしますか？')) return;
            recipes = data.recipes;
            weeklyMenu = data.weeklyMenu || {};
            settings = data.settings || settings;
            checkedItems = data.checkedItems || {};
            saveData();
            syncSettingsUI();
            renderWeeklyCalendar();
            renderRecipeList();
            alert('復元完了しました！');
        } catch (err) {
            alert('ファイルの読み込みに失敗しました。');
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}

function checkNG(recipe) {
    if (!settings.ngItems) return [];
    const ngList = settings.ngItems.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    let found = [];
    recipe.ingredients.forEach(ing => {
        ngList.forEach(ng => {
            if (ing.name.toLowerCase().includes(ng) && !found.includes(ng)) found.push(ng);
        });
    });
    return found;
}

function renderWeeklyCalendar() {
    const container = document.getElementById('weekly-calendar');
    container.innerHTML = '';
    days.forEach(day => {
        const currentId = weeklyMenu[day] || '';
        const recipe = recipes.find(r => r.id === currentId);
        const ngFound = recipe ? checkNG(recipe) : [];
        const badge = ngFound.length ? `<span class="badge-danger">⚠️ 苦手(${ngFound.join(',')})</span>` : '';

        const row = document.createElement('div');
        row.className = 'day-row';
        row.innerHTML = `
            <span class="day-label">${day}曜日</span>
            <select class="day-menu-select" onchange="updateWeeklyMenu('${day}', this.value)">
                <option value="">（お休み）</option>
                ${recipes.map(r => `<option value="${r.id}" ${r.id === currentId ? 'selected' : ''}>${r.name}</option>`).join('')}
            </select>
            ${badge}
        `;
        container.appendChild(row);
    });
}

function updateWeeklyMenu(day, id) {
    weeklyMenu[day] = id;
    saveData();
    renderWeeklyCalendar();
}

function autoAssignMenu() {
    let targetRecipes = settings.ngFilter ? recipes.filter(r => checkNG(r).length === 0) : recipes;
    if (targetRecipes.length === 0) targetRecipes = recipes;
    days.forEach(day => {
        weeklyMenu[day] = targetRecipes[Math.floor(Math.random() * targetRecipes.length)].id;
    });
    saveData();
    renderWeeklyCalendar();
    alert('おまかせ献立を作成しました！');
}

function renderRecipeList() {
    const container = document.getElementById('recipe-list-container');
    container.innerHTML = recipes.length === 0 ? '<p>レシピがありません</p>' : recipes.map(r => {
        const ng = checkNG(r);
        const badge = ng.length ? `<span class="badge-danger">⚠️ 苦手(${ng.join(',')})</span>` : '';
        return `<div class="recipe-card">
            <button class="delete-btn" onclick="deleteRecipe('${r.id}')">削除</button>
            <h3>${r.name} ${badge}</h3>
            <div class="recipe-meta">材料: ${r.ingredients.map(i => `${i.name}${i.amount}${i.unit}`).join(', ')}</div>
        </div>`;
    }).join('');
}

function deleteRecipe(id) {
    if(confirm('削除しますか？')) {
        recipes = recipes.filter(r => r.id !== id);
        saveData();
        renderRecipeList();
        renderWeeklyCalendar();
    }
}

function parseAndAddRecipe() {
    const name = document.getElementById('new-recipe-name').value.trim();
    const text = document.getElementById('new-recipe-text').value.trim();
    if(!name || !text) return alert('入力してください');

    const ingredients = text.split('\n').map(line => {
        line = line.trim();
        const match = line.match(/^(.+?)\s+([\d0-9\.\/]+)\s*([gml個本パック束切大さじ小さじカップ枚滴缶]*)/);
        if(match) {
            return { name: match[1].trim(), amount: parseFloat(match[2]) || 1, unit: match[3] || '個', category: '野菜' };
        }
        return { name: line, amount: 1, unit: '個', category: '野菜' };
    }).filter(i => i.name);

    recipes.push({ id: 'r_' + Date.now(), name, ingredients });
    saveData();
    document.getElementById('new-recipe-name').value = '';
    document.getElementById('new-recipe-text').value = '';
    renderRecipeList();
    renderWeeklyCalendar();
    alert('レシピを追加しました！');
}

function renderShoppingList() {
    const container = document.getElementById('shopping-list-container');
    container.innerHTML = '';
    const multiplier = settings.adults + (settings.children * 0.6);
    const aggregated = {};

    days.forEach(day => {
        const recipe = recipes.find(r => r.id === weeklyMenu[day]);
        if(!recipe) return;
        recipe.ingredients.forEach(ing => {
            const key = ing.name + '_' + ing.unit;
            if(!aggregated[key]) aggregated[key] = { name: ing.name, amount: 0, unit: ing.unit, category: ing.category || '野菜' };
            aggregated[key].amount += (ing.amount * (multiplier / 2));
        });
    });

    const categories = { '野菜': [], '肉・魚': [], '冷蔵・日配': [], '調味料・その他': [] };
    Object.values(aggregated).forEach(item => {
        if(!categories[item.category]) categories['野菜'].push(item);
        else categories[item.category].push(item);
    });

    let has = false;
    Object.keys(categories).forEach(cat => {
        const items = categories[cat];
        if(items.length === 0) return;
        has = true;
        let html = `<div class="category-group"><div class="category-title">${cat}</div>`;
        items.forEach((item, idx) => {
            const id = cat + '_' + idx;
            const checked = checkedItems[id] ? 'checked' : '';
            const cls = checkedItems[id] ? 'shopping-item checked' : 'shopping-item';
            const isNg = settings.ngItems.split(',').some(ng => ng.trim() && item.name.toLowerCase().includes(ng.trim().toLowerCase()));
            const badge = isNg ? `<span class="badge-danger">⚠️ 苦手</span>` : '';
            html += `<div class="${cls}" id="div_${id}">
                <input type="checkbox" id="${id}" ${checked} onchange="toggleCheck('${id}')">
                <span>${item.name}: <strong>${Math.round(item.amount * 10) / 10}${item.unit}</strong> ${badge}</span>
            </div>`;
        });
        html += `</div>`;
        container.innerHTML += html;
    });

    if(!has) container.innerHTML = '<p>献立が選択されていません。</p>';
}

function toggleCheck(id) {
    const cb = document.getElementById(id);
    checkedItems[id] = cb.checked;
    document.getElementById('div_' + id).className = cb.checked ? 'shopping-item checked' : 'shopping-item';
    saveData();
}

function copyShoppingList() {
    let text = "【買い物リスト】\n";
    const multiplier = settings.adults + (settings.children * 0.6);
    const aggregated = {};
    days.forEach(day => {
        const recipe = recipes.find(r => r.id === weeklyMenu[day]);
        if(!recipe) return;
        recipe.ingredients.forEach(ing => {
            const key = ing.name + '_' + ing.unit;
            if(!aggregated[key]) aggregated[key] = { name: ing.name, amount: 0, unit: ing.unit };
            aggregated[key].amount += (ing.amount * (multiplier / 2));
        });
    });
    Object.values(aggregated).forEach(item => {
        text += `・${item.name}: ${Math.round(item.amount * 10) / 10}${item.unit}\n`;
    });
    navigator.clipboard.writeText(text).then(() => alert('コピーしました！'));
}
