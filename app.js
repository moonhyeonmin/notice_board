const express = require("express");
const postService = require("./services/post-service"); // 1) 서비스 파일 로딩
const handlebars = require("express-handlebars");
const app = express();

const mongodbConnection = require("./configs/mongodb-connection");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.engine(
  "handlebars",
  handlebars.create({
    // 핸들바 생성 및 엔진 반환
    helpers: require("./configs/handlebars-helpers"),
  }).engine
);

app.engine("handlebars", handlebars.engine()); // 1 템플릿 엔진으로 핸들바 등록
app.set("view engine", "handlebars"); // 2 웹페이지 로드 시 사용할 템플릿 엔진 설정
app.set("views", __dirname + "/views"); // 3 뷰 디렉토리를 views로 설정

app.get("/", (req, res) => {
  // 1. 시작 페이지 구현
  res.render("home", { title: "테스트 게시판", message: "만나서 반갑습니다!" });
});

app.get("/write", (req, res) => {
  // 2. 글쓰기 페이지 구현
  res.render("write", { title: "테스트 게시판" });
});

app.post("/write", async (req, res) => {
  const post = req.body;
  const result = await postService.writePost(collection, post); // 글쓰기 후 결과 반환
  res.redirect(`/detail/${result.insertedId}`); // 생성된 도큐먼트의 __id를 이용해 상세페이지로 이동
});

app.get("/detail/:id", async (req, res) => {
  res.render("detail", {
    title: "테스트 게시판",
  });
});

let collection;

app.listen(3000, async () => {
  console.log("Server started");
  // mongodbConnection(의 결과 = mongoClient
  const mongoClient = await mongodbConnection();
  // mongoClient.db()로 디비 선택 collection()으로 컬렉션 선택 후 collection에 할당
  collection = mongoClient.db().collection("post");
  console.log("MongoDB connected");
});
