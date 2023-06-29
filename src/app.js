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
app.post("/participants", (req, res) => {
    const { name } = req.body


    //validações feita pela biblioteca joi
    //name deve ser string e ñ vazia - erro status 422

    const participantSchema = Joi.object({
        name: Joi.string().required()
    })

    const validation = participantSchema.validate({ name })
    console.log(validation)

    if (validation.error) {
        return res.status(422).send(validation.error.details)
    }

    //caso exista cadastro com nome ja usado, retornar status 409

    // const nameExist = db.collection("participants").findOne({ name })
    // console.log(nameExist)

    // if (nameExist) {
    //     return res.status(409).send("Esse nome já esta cadastrado!")
    // }

    //salvar participante na coleçao de nome participants com mongoDB
    db.collection("participants").insertOne({ name, lastStatus: Date.now() })
        .then(() => {
             db.collection("messages").insertOne(
                { 
                    from: name, 
                    to: "Todos", 
                    text: "entra na sala...", 
                    type: "status",
                    time: date
                 })
             res.status(201).send("Usuário criado")
             return
        })
        .catch(err => {
            return res.status(500).send(err.message)
        })



    //salvar com mongoDB uma msg na collection messages


    //por fim , caso sucesso retornar status 201, 

})

app.get("/participants", (req, res) => {
    //retornar a lista de todos os participantes
    //caso n houver nenhum retornar []

    db.collection("participants").find().toArray()
        .then((participants) => {
            return res.send(participants)
        })
        .catch(err => {
            return res.status(500).send(err.message)
        })


})

app.post("/messages", (req, res) => {
    //receber do body os parametros to, text e type
    const { to, text, type } = req.body
    //Já o from da mensagem, ou seja, o remetente, não será enviado pelo body. 
    //Será enviado pelo cliente através de um header na requisição chamado User. 

    //   Validar: (caso algum erro seja encontrado, retornar **status 422**).
    //   to e text devem ser strings não vazias.
    //   type só pode ser `message` ou `private_message`.
    //   from é obrigatório e deve ser um participante existente na lista de participantes (ou seja, que está na sala).

    //por fim , caso sucesso retornar status 201, 
    res.status(201)

})

app.get("/messages", (req, res) => {
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