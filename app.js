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

// 리스트 페이지
app.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1; // 현재 페이지 데이터
  const search = req.query.search || ""; // 검색어 데이터
  try {
    const [posts, paginator] = await postService.list(collection, page, search); // postService.list에서 글 목록과 페이지네이터를 가져옴

    res.render("home", { title: "테스트 게시판", search, paginator, posts }); // 리스트 페이지 렌더링
  } catch (error) {
    console.error(error);

    res.render("home", { title: "테스트 게시판" }); // 에러가 나는 경우 빈 값으로 렌더링
  }
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
  // 상세페이지로 이동
  const result = await postService.getDetailPost(collection, req.params.id);
  res.render("detail", {
    title: "테스트 게시판",
    post: result.value,
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
