import { Hono } from 'hono';

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get('/', c => c.text('Hello World'));

app.get('/api/ingredients', async c => {
    const { results } = await c.env.DATABASE.prepare('SELECT * FROM ingredients').all();
    return c.json(results);
});

app.get('/api/ingredients/:id', async c => {
    const { id } = c.req.param();
    const { results } = await c.env.DATABASE.prepare('SELECT * FROM ingredients WHERE id = ?')
        .bind(id)
        .all();
    if (results.length === 0) {
        return c.json({ error: 'Ingredient not found' }, 404);
    }
    return c.json(results[0]);
});

app.post('/api/ingredients', async c => {
    const { name, caloriesPer100g } = await c.req.json();
    const { results } = await c.env.DATABASE.prepare(
        'INSERT INTO ingredients (name, calories_per_100g) VALUES (?, ?)',
    )
        .bind(name, caloriesPer100g)
        .all();
    return c.json(results[0]);
});

app.put('/api/ingredients/:id', async c => {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { name, caloriesPer100g } = body;

    let query = 'UPDATE ingredients SET ';
    const params = [];
    const updateFields = [];

    if (name !== undefined) {
        updateFields.push('name = ?');
        params.push(name);
    }

    if (caloriesPer100g !== undefined) {
        updateFields.push('calories_per_100g = ?');
        params.push(caloriesPer100g);
    }

    if (updateFields.length === 0) {
        return c.json({ error: 'Нет данных для обновления' }, 400);
    }

    query += updateFields.join(', ') + ' WHERE id = ?';
    params.push(id);

    const { results } = await c.env.DATABASE.prepare(query)
        .bind(...params)
        .all();

    return c.json(results[0]);
});

app.delete('/api/ingredients/:id', async c => {
    const { id } = c.req.param();
    const { results } = await c.env.DATABASE.prepare('DELETE FROM ingredients WHERE id = ?')
        .bind(id)
        .all();
    return c.json(results[0]);
});

app.get('/api/ingredients/:id/recipes', async c => {
    const { id } = c.req.param();
    const { results } = await c.env.DATABASE.prepare(
        'SELECT * FROM recipes WHERE ingredient_id = ?',
    )
        .bind(id)
        .all();
    return c.json(results);
});

export default app;
