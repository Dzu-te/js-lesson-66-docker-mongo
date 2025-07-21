import express from 'express';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config();

const MONGO_CONNECTION = process.env.MONGO_CONNECTION;
const PORT = process.env.PORT || 3000;

const client = new MongoClient(MONGO_CONNECTION);

const app = express();
app.use(express.json());

let db;

app.get('/', (req, res) => {
  res.json({
    message: 'MongoDB Atlas Express API',
    endpoints: {
      'GET /theaters': 'Отримати театри',
      'GET /comments': 'Отримати коментарі',
      'GET /embedded_movies': 'Отримати вбудовані фільми',
      'GET /movies': 'Отримати фільми',
      'GET /movies/projection?fields=title,year': 'Отримати фільми з проекцією полів',
      'POST /movies': 'Створити новий фільм',
      'POST /movies/many': 'Створити багато фільмів',
      'PUT /movies/:id': 'Оновити фільм за ID',
      'PUT /movies': 'Оновити багато фільмів (потрібен filter та update в body)',
      'PUT /movies/:id/replace': 'Замінити фільм за ID',
      'DELETE /movies/:id': 'Видалити фільм за ID',
      'DELETE /movies': 'Видалити багато фільмів (потрібен filter в body)'
    }
  });
});



app.get('/theaters', async (req, res) => {
  const theatersCollection = await db.collection('theaters').find().limit(10).toArray();
  console.log('theatersCollection', theatersCollection);
  res.json(theatersCollection);
});



app.get('/comments', async (req, res) => {
  const commentsCollection = await db.collection('comments').find().limit(10).toArray();
  console.log('commentsCollection', commentsCollection);
  res.json(commentsCollection);
});

app.get('/embedded_movies', async (req, res) => {
  const embedded_movies = await db.collection('embedded_movies').find().limit(10).toArray();
  console.log('embedded_movies', embedded_movies);
  res.json(embedded_movies);
});

app.get('/movies', async (req, res) => {
  const moviesCollection = await db.collection('movies').find().limit(10).toArray();
  console.log('moviesCollection', moviesCollection);
  res.json(moviesCollection);
});

// Розширене читання з проекцією
app.get('/movies/projection', async (req, res) => {
  try {
    const { fields } = req.query;
    let projection = {};

    if (fields) {
      const fieldArray = fields.split(',');
      fieldArray.forEach(field => {
        projection[field.trim()] = 1;
      });
    }

    const moviesCollection = await db.collection('movies')
      .find({}, { projection })
      .limit(10)
      .toArray();

    console.log('moviesCollection with projection', moviesCollection);
    res.json(moviesCollection);
  } catch (error) {
    console.error('Error in movies projection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Створення одного документа (insertOne)
app.post('/movies', async (req, res) => {
  try {
    const newMovie = req.body;
    const result = await db.collection('movies').insertOne(newMovie);
    console.log('Movie inserted:', result);
    res.status(201).json({
      message: 'Movie created successfully',
      insertedId: result.insertedId
    });
  } catch (error) {
    console.error('Error inserting movie:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Створення багатьох документів (insertMany)
app.post('/movies/many', async (req, res) => {
  try {
    const newMovies = req.body;
    if (!Array.isArray(newMovies)) {
      return res.status(400).json({ error: 'Request body must be an array' });
    }

    const result = await db.collection('movies').insertMany(newMovies);
    console.log('Movies inserted:', result);
    res.status(201).json({
      message: 'Movies created successfully',
      insertedCount: result.insertedCount,
      insertedIds: result.insertedIds
    });
  } catch (error) {
    console.error('Error inserting movies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Оновлення одного документа (updateOne)
app.put('/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const result = await db.collection('movies').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    console.log('Movie updated:', result);

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json({
      message: 'Movie updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating movie:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Оновлення багатьох документів (updateMany)
app.put('/movies', async (req, res) => {
  try {
    const { filter, update } = req.body;

    if (!filter || !update) {
      return res.status(400).json({ error: 'Filter and update fields are required' });
    }

    const result = await db.collection('movies').updateMany(filter, { $set: update });
    console.log('Movies updated:', result);

    res.json({
      message: 'Movies updated successfully',
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating movies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Заміна одного документа (replaceOne)
app.put('/movies/:id/replace', async (req, res) => {
  try {
    const { id } = req.params;
    const replacementData = req.body;

    const result = await db.collection('movies').replaceOne(
      { _id: new ObjectId(id) },
      replacementData
    );

    console.log('Movie replaced:', result);

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json({
      message: 'Movie replaced successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error replacing movie:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Видалення одного документа (deleteOne)
app.delete('/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.collection('movies').deleteOne(
      { _id: new ObjectId(id) }
    );

    console.log('Movie deleted:', result);

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json({
      message: 'Movie deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting movie:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Видалення багатьох документів (deleteMany)
app.delete('/movies', async (req, res) => {
  try {
    const { filter } = req.body;

    if (!filter) {
      return res.status(400).json({ error: 'Filter field is required' });
    }

    const result = await db.collection('movies').deleteMany(filter);
    console.log('Movies deleted:', result);

    res.json({
      message: 'Movies deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting movies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Эндпоинт с курсор-пагинацией
app.get('/movies/cursor', async (req, res) => {
  try {
    const { limit = 10, lastId } = req.query;
    const query = lastId ? { _id: { $gt: new ObjectId(lastId) } } : {};

    const cursor = db.collection('movies').find(query).limit(Number(limit));
    const movies = [];
    let lastMovie = null;

    while (await cursor.hasNext()) {
      const movie = await cursor.next();
      movies.push(movie);
      lastMovie = movie;
    }

    res.json({
      movies,
      nextCursor: lastMovie ? lastMovie._id : null,
      hasMore: movies.length === Number(limit)
    });
  } catch (error) {
    console.error('Ошибка в курсор-пагинации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Эндпоинт статистики фильмов
app.get('/movies/stats', async (req, res) => {
  try {
    const stats = await db.collection('movies').aggregate([
      {
        $facet: {
          'genreStats': [
            { $unwind: '$genres' },
            {
              $group: {
                _id: '$genres',
                count: { $sum: 1 },
                avgYear: { $avg: '$year' },
                avgRuntime: { $avg: '$runtime' }
              }
            },
            { $sort: { count: -1 } }
          ],
          'yearStats': [
            {
              $group: {
                _id: { $floor: { $divide: ['$year', 10] } },
                count: { $sum: 1 },
                avgRuntime: { $avg: '$runtime' },
                minYear: { $min: '$year' },
                maxYear: { $max: '$year' }
              }
            },
            { $sort: { '_id': 1 } },
            {
              $project: {
                decade: { $concat: [{ $toString: { $multiply: ['$_id', 10] } }, 'е'] },
                count: 1,
                avgRuntime: 1,
                yearRange: {
                  $concat: [
                    { $toString: '$minYear' },
                    ' - ',
                    { $toString: '$maxYear' }
                  ]
                }
              }
            }
          ],
          'totalStats': [
            {
              $group: {
                _id: null,
                totalMovies: { $sum: 1 },
                avgYear: { $avg: '$year' },
                avgRuntime: { $avg: '$runtime' },
                oldestMovie: { $min: '$year' },
                newestMovie: { $max: '$year' }
              }
            }
          ]
        }
      }
    ]).toArray();

    res.json(stats[0]);
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

async function startServer() {
  try {

    await client.connect();
    console.log('Connected to MongoDB');

    db = client.db('sample_mflix');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error', error);
  }
}

startServer();