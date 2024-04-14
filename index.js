const express = require("express");
const app = new express();
const cors = require("cors");
const path = require("path");
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../SQLiteDb/pollos_max.db');

app.use(cors());

app.use(express.static(path.join(__dirname, 'dist')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});
app.set('json spaces', 2);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/login', async (req, res) => {
  const { user, pass } = req.body;

  if (!user || !pass) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  try {
    const query = `SELECT idUser, username, password, userTypeName FROM user, userType WHERE hex(username) = hex(?) AND hex(password) = hex(?) AND user.idUserType = userType.idUserType AND userStatus = 'ACTIVO'`;
    db.all(query, [user, pass], (error, result) => {
      if (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Error en la base de datos" });
      } else {
        if (result.length === 0) {
          return res.status(400).json({ message: "Usuario o contraseña incorrectos" });
        }
        res.status(200).json(result[0]);
      }
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error en la base de datos" });
  }
});

//funcion para obtener el inventario
app.get('/inventory', async (req, res) => {
  try {
    const query = `SELECT * FROM product a 
    INNER JOIN unit b on a.idUnit = b.idUnit 
    INNER JOIN producttype c on a.idProductType = c.idProductType 
    ORDER BY idProduct ASC`;
    db.all(query, [], (error, result) => {
      if (error) {
        console.error("Error during fetching inventory:", error);
        res.status(500).json({ message: "Error en la base de datos" });
      } else {
        res.status(200).json(result);
      }
    });
  } catch (error) {
    console.error("Error during fetching inventory:", error);
    res.status(500).json({ message: "Error en la base de datos" });
  }
});

//funcion para actualizar la cantidad minima de un producto
app.put('/updateInventoryAmount', (req, res) => {
  const { idProduct, minimumAmount } = req.body;

  if (!idProduct || minimumAmount === undefined) {
    return res.status(400).json({ message: "Faltan datos" });
  }
  try {
    const query = `UPDATE product SET minimumAmount = ? WHERE idProduct = ?`;
    db.run(query, [minimumAmount, idProduct], function(error) {
      if (error) {
        console.error("Error during product update:", error);
        res.status(500).json({ message: "Error en la base de datos" });
      } else {
        res.status(200).json({ message: "Producto actualizado con éxito" });
      }
    });

  } catch (error) {
    console.error("Error during product update:", error);
    res.status(500).json({ message: "Error en la base de datos" });
  }
});

//Funcion para agregar un producto
app.post('/addInventoryProduct', (req, res) => {
  const { idProductType, idUnit, productName, productAmount, minimumAmount, productPrice } = req.body;

  if ( !idProductType || !idUnit || !productName || productAmount === undefined || minimumAmount === undefined || productPrice === undefined) {
    return res.status(400).json({ message: "Faltan datos" });
  }
  try {
    const query = `INSERT INTO product (idProductType, idUnit, productName, productAmount, minimumAmount, productPrice) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [idProductType, idUnit, productName, productAmount, minimumAmount, productPrice], function(error) {
      if (error) {
        console.error("Error durante la creación del producto:", error);
        res.status(500).json({ message: "Error en la base de datos" });
      } else {
        res.status(200).json({ message: "Producto agregado con éxito" });
      }
    });

  } catch (error) {
    console.error("Error durante la creación del producto:", error);
    res.status(500).json({ message: "Error en la base de datos" });
  }
});

//CRUD de la sección de productos
app.get('/products', (req, res) => {
  try {
    const query = `SELECT idProduct, productName, productPrice, productAmount FROM product;`;
    db.all(query, [], (error, result) => {
      if (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ message: "Error en la base de datos" });
      } else {
        res.status(200).json(result);
      }
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ message: "Error en la base de datos" });
  }
});

app.post('/insertProduct', (req, res) => {
  try {
    const { productName, productPrice, productAmount, idProductType, idUnit, minimumAmount } = req.body;

    // Verificar si todos los campos requeridos están presentes en la solicitud
    if (!productName || !productPrice || !productAmount || !idProductType || !idUnit || !minimumAmount) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    const query = `
        INSERT INTO product (idProductType, idUnit, productName, productAmount, minimumAmount, productPrice)
        VALUES (?, ?, ?, ?, ?, ?);
    `;
    db.run(query, [idProductType, idUnit, productName, productAmount, minimumAmount, productPrice], function(error) {
      if (error) {
        console.error("Error al insertar producto:", error);
        res.status(500).json({ message: "Error al insertar el producto en la base de datos" });
      } else {
        const insertedId = this.lastID;
        res.status(200).json({ message: 'Producto insertado correctamente.', insertedId });
      }
    });
  } catch (error) {
    console.error("Error al insertar producto:", error);
    res.status(500).json({ message: "Error al insertar el producto en la base de datos" });
  }
});

app.put('/updateProduct/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { productName, productPrice, productAmount } = req.body;

    if (!productName || !productPrice || !productAmount) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    const query = `
      UPDATE product
      SET productName = ?, productPrice = ?, productAmount = ?
      WHERE idProduct = ?;
    `;
    db.run(query, [productName, productPrice, productAmount, id], function(error) {
      if (error) {
        console.error("Error al actualizar producto:", error);
        res.status(500).json({ message: "Error al actualizar el producto en la base de datos" });
      } else {
        res.status(200).json({ message: 'Producto modificado correctamente.' });
      }
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({ message: "Error al actualizar el producto en la base de datos" });
  }
});

app.delete('/deleteProduct/:id', (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      DELETE FROM product
      WHERE idProduct = ?;
    `;
    db.run(query, [id], function(error) {
      if (error) {
        console.error("Error al eliminar producto:", error);
        res.status(500).json({ message: "Error al eliminar el producto de la base de datos" });
      } else {
        res.status(200).json({ message: 'Producto eliminado correctamente.' });
      }
    });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({ message: "Error al eliminar el producto de la base de datos" });
  }
});

app.post('/search', (req, res) => {
  try {
    const { search } = req.body;
    const query = `SELECT idProduct, productName, productAmount FROM product WHERE productName LIKE ? AND idProductType = 2;`;
    db.all(query, [`%${search}%`], (error, result) => {
      if (error) {
        console.error("Error during search:", error);
        res.status(500).json({ message: "Error en la base de datos" });
      } else {
        res.status(200).json(result);
      }
    });
  } catch (error) {
    console.error("Error during search:", error);
    res.status(500).json({ message: "Error en la base de datos" });
  }
});

app.post('/searchProductos', (req, res) => {
  try {
    const { id } = req.body;
    console.log("Received id:", id); // Log the received id

    const query = `SELECT productPrice FROM product WHERE productName LIKE ? AND idProductType = 2 LIMIT 1`;
    console.log("Query:", query); // Log the query

    db.all(query, [`%${id}%`], (error, result) => {
      if (error) {
        console.error("Error during search:", error);
        res.status(500).json({ message: "Error en la base de datos" });
      } else {
        console.log("Result:", result); // This should print the result
        res.status(200).json(result[0]);
      }
    });
  } catch (error) {
    console.error("Error during search:", error);
    res.status(500).json({ message: "Error en la base de datos" });
  }
});

app.get('/productssale', (req, res) => {
  try {
    const query = `SELECT idProduct, productName, productPrice, productAmount FROM product WHERE idProductType = 2;`;
    db.all(query, [], (error, result) => {
      if (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ message: "Error en la base de datos" });
      } else {
        res.status(200).json(result);
      }
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ message: "Error en la base de datos" });
  }
});

app.post('/transaction', (req, res) => {
  const { idUser, idMovementType, totalPrice } = req.body;

  if (!idUser || !idMovementType || totalPrice === undefined) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  try {
    const query = `INSERT INTO "transaction"(idUser, idMovementType, date, time, totalPrice) VALUES (?, ?, datetime('now'), datetime('now'), ?)`;
    db.run(query, [idUser, idMovementType, totalPrice], function(error) {
      if (error) {
        console.error("Error al registrar la transacción:", error);
        res.status(500).json({ message: "Error en la base de datos" });
      } else {
        res.status(200).json({ message: "Transacción registrada con éxito" });
      }
    });

  } catch (error) {
    console.error("Error al registrar la transacción:", error);
    res.status(500).json({ message: "Error en la base de datos" });
  }
});

//update product amount
app.put('/updateProductAmount', (req, res) => {
  const { idProduct, productAmount } = req.body;

  if (!idProduct || productAmount === undefined) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  try {
    const query = `UPDATE product SET productAmount = ? WHERE idProduct = ?`;
    db.run(query, [productAmount, idProduct], function(error) {
      if (error) {
        console.error("Error durante la actualización del producto:", error);
        res.status(500).json({ message: "Error en la base de datos" });
      } else {
        res.status(200).json({ message: "Producto actualizado con éxito" });
      }
    });

  } catch (error) {
    console.error("Error durante la actualización del producto:", error);
    res.status(500).json({ message: "Error en la base de datos" });
  }
});

app.post('/insertProductChange', (req, res) => {
  const { idUser, idProduct, idChangeType } = req.body;

  if (!idUser || !idProduct || !idChangeType) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  try {
    const query = `INSERT INTO productchange(idUser, idProduct, idChangeType, date, time) VALUES (?, ?, ?, datetime('now'), datetime('now'))`;
    db.run(query, [idUser, idProduct, idChangeType], function(error) {
      if (error) {
        console.error("Error al insertar el cambio de producto:", error);
        res.status(500).json({ message: "Error en la base de datos" });
      } else {
        res.status(200).json({ message: "Cambio de producto insertado con éxito" });
      }
    });

  } catch (error) {
    console.error("Error al insertar el cambio de producto:", error);
    res.status(500).json({ message: "Error en la base de datos" });
  }
});