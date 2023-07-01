import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import Joi from "joi"
import dayjs from "dayjs"

const app = express();
app.use(cors())
app.use(express.json())
dotenv.config()

const date = dayjs().format("hh:mm:ss")

//conexão com o banco
const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db

mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message))


//funções
app.post("/participants", async (req, res) => {
    const { name } = req.body

    //validações feita pela biblioteca joi
    //name deve ser string e ñ vazia - erro status 422

    const participantSchema = Joi.object({
        name: Joi.string().required()
    })

    const validation = participantSchema.validate({ name })
    console.log(validation)

    if (validation.error) return res.status(422).send(validation.error.details)
    
    //caso exista cadastro com nome ja usado, retornar status 409
    //salvar participante na coleçao de nome participants com mongoDB
    //salvar com mongoDB uma msg na collection messages
    //por fim , caso sucesso retornar status 201, 
    try {

        const nameExist = await db.collection("participants").findOne({name})

        if (nameExist) return res.status(409).send("Usuário já cadastrado")

        await db.collection("participants").insertOne({ name, lastStatus: Date.now() })

        await db.collection("messages").insertOne(
            {
                from: name,
                to: "Todos",
                text: "entra na sala...",
                type: "status",
                time: date
            })

        res.status(201).send("Usuário criado")

    } catch (err) {
        res.status(500).send(err.message)
    }

})

app.get("/participants", async (req, res) => {
    //retornar a lista de todos os participantes
    //caso n houver nenhum retornar []

    try {
        const participants = await db.collection("participants").find().toArray()
        res.send(participants)
    } catch (err) {
        res.status(500).send(err.message)
    }

})

app.post("/messages", (req, res) => {
    //receber do body os parametros to, text e type
    const { to, text, type } = req.body

    console.log(text)
    //Já o from da mensagem, ou seja, o remetente, não será enviado pelo body. 
    //Será enviado pelo cliente através de um header na requisição chamado User. 
    const { user } = req.headers
    console.log(user)

    //   Validar: (caso algum erro seja encontrado, retornar **status 422**).
    //   to e text devem ser strings não vazias.
    //   type só pode ser `message` ou `private_message`.
    //   from é obrigatório e deve ser um participante existente na lista de participantes (ou seja, que está na sala).

    const messageSchema = Joi.object({
        from: Joi.string().required(),
        to: Joi.string().required(),
        text: Joi.string().required(),
        type: Joi.string().valid('message', 'private_message').required()
    })

    const validation = messageSchema.validate({ to, text, type, from: user })
    console.log(validation)

    //por fim , caso sucesso retornar status 201, 
    res.status(201)

})

app.get("/messages", (req, res) => {

    let { user } = req.headers
    let limit

    if (req.query.limit) {
        limit = parseInt(req.query.limit);
        if (limit < 1 || isNaN(limit)) {
            res.status(422).send("Limite inválido")
            return
        }
    }




    res.send("ok")
})

app.post("/status", (req, res) => {
    //Deve receber por um header na requisição, chamado User, contendo o nome do participante a ser atualizado.

    //Caso este header não seja passado, retorne o status 404.
    //Caso este participante não conste na lista de participantes, deve ser retornado um status 404
    res.status(404)

    //Atualizar o atributo lastStatus do participante informado para o timestamp atual, utilizando Date.now().

    //caso sucesso status 200
    res.status(200)
})

//Ligar a aplicação do servidor para ouvir requisições
const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor iniciado na porta ${PORT}`))