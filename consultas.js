// Importar módulos requeridos
const { Pool } = require('pg');

// Instancia Pool
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    password: "postgresql",
    database: "bancosolar",
    port: 5432,
});

// Función asíncrona para insertar usuarios
const insertar = async (datos) => {
    const values = Object.values(datos);
    const consulta = {
        text: 'INSERT INTO usuarios (nombre, balance) VALUES ($1, $2)',
        values
    };
    try {
        const result = await pool.query(consulta);
        return result;
    } catch (error) {
        throw error;
    }
};

// Función asíncrona para consultar usuarios
const consultar = async () => {
    try {
        const result = await pool.query('SELECT id, nombre, balance FROM usuarios ORDER BY id ASC');
        return result.rows;
    } catch (error) {
        throw error;
    }
};

// Función asíncrona para editar usuarios
const editar = async (datos, id) => {
    const values = Object.values(datos).concat([id]);
    const consulta = {
        text: `UPDATE usuarios SET nombre = $1, balance = $2 WHERE id = $3 RETURNING *`,
        values
    };
    try {
        const result = await pool.query(consulta);
        return result;
    } catch (error) {
        throw error;
    }
};

// Función asíncrona para eliminar usuarios
const eliminar = async (id) => {
    const client = await pool.connect();
    const values = Object.values([id]);
    try {
        const consulta = {
            text: 'DELETE FROM transferencias WHERE emisor = $1 OR receptor = $1 RETURNING *;',
            values
        };
        const consulta2 = {
            text: 'DELETE FROM usuarios WHERE id = $1 RETURNING *;',
            values
        };
        await pool.query(consulta);
        await pool.query(consulta2);

    } catch (e) {
        throw error;
    }
};


// Función asíncrona para realizar transferencias
const transferir = async ({ emisor, receptor, monto }) => {
    const client = await pool.connect();
    try {
        const update1 = {
            text: 'UPDATE usuarios SET balance = balance - $2 WHERE id = $1',
            values: [emisor, monto]
        };
        const update2 = {
            text: 'UPDATE usuarios SET balance = balance + $2 WHERE id = $1',
            values: [receptor, monto]
        };

        const insert = {
            text: 'INSERT INTO transferencias (emisor, receptor, monto, fecha) VALUES ($1, $2, $3, now())',
            values: [emisor, receptor, monto]
        };
        await client.query("BEGIN");
        await client.query(update1);
        await client.query(update2);
        const result = await client.query(insert);
        await client.query("COMMIT");
        client.release();
        return result;
    } catch (e) {
        await client.query("ROLLBACK");

        console.log('e.message: ', e.message);
        console.log('Error código: ', e.code);
        console.log('Detalle del error: ', e.detail);
        console.log('Tabla originaria del error: ', e.table);
        console.log('Restricción violada en el campo: ', e.constraint);
    }
};

// Función asíncrona para consultar transferencias
const consultarTransf = async () => {
    try {
        const consulta = {
            text: "SELECT fecha, n.nombre, p.nombre, monto FROM transferencias AS t INNER JOIN usuarios AS n ON t.emisor = n.id INNER JOIN usuarios AS p ON t.receptor = p.id",
            rowMode: 'array'
        };
        const result = await pool.query(consulta);
        return result.rows;
    } catch (error) {
        throw error;
    }
};

// Exportar funciones
module.exports = { insertar, consultar, editar, eliminar, transferir, consultarTransf };
