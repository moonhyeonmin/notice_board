const express = require("express");
const postService = require("./services/post-service"); // 1) 서비스 파일 로딩
const handlebars = require("express-handlebars");
const app = express();
const { ObjectId } = require("mongodb");

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

app.set("view engine", "handlebars"); // 2 웹페이지 로드 시 사용할 템플릿 엔진 설정
app.set("views", __dirname + "/views"); // 3 뷰 디렉토리를 views로 설정

// 리스트 페이지
app.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1; // 현재 페이지 데이터
  const search = req.query.search || ""; // 데이터
  try {
    const [posts, paginator] = await postService.list(collection, page, search); // postService.list에서 글 목록과 페이지네이터를 가져옴

    res.render("home", { title: "테스트 게시판", search, paginator, posts }); // 리스트 페이지 렌더링
  } catch (error) {
    console.error(error);

    res.render("home", { title: "테스트 게시판" }); // 에러가 나는 경우 빈 값으로 렌더링
  }
});

app.get("/write", (req, res) => {
  // 쓰기 페이지 이동 mode는 create
  res.render("write", { title: "테스트 게시판", mode: "create" });
});

// 수정 페이지로 이동 mode는 modify
app.get("/modify/:id", async (req, res) => {
  const { id } = req.params.id;
  const post = await postService.getPostById(collection, req.params.id); // getPostById() 함수로 게시글 데이터를 받아옴
  console.log(post);
  res.render("write", { title: "테스트 게시판 ", mode: "modify", post });
});

app.post("/modify", async (req, res) => {
  const { id, title, writer, password, content } = req.body;

  const post = {
    title,
    writer,
    password,
    content,
    createdDt: new Date().toISOString(),
  };

  const result = postService.updatePost(collection, id, post); // 업데이트 결과
  res.redirect(`/detail/${id}`);
});

app.delete("/delete", async (req, res) => {
  // 게시글 삭제
  const { id, password } = req.body;
  try {
    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      password: password,
    }); // collection의 deleteOne을 사용해 게시글 하나를 삭제

    if (result.deletedCount !== 1) {
      // 삭제가 잘 못된 경우의 처리
      console.log("삭제 실패");
      return res.json({ isSuccess: false });
    }
    return res.json({ isSuccess: true });
  } catch (error) {
    // 에러가 난 경우 처리
    console.error(error);
    return res.json({ isSuccess: true });
  }
});

app.post("/write-comment", async (req, res) => {
  // 댓글 추가 API
  const { id, name, password, comment } = req.body; // body에서 데이터를 가져오기
  const post = await postService.getPostById(collection, id); // id로 게시글 정보 가져오기

  if (post.comments) {
    // 게시글에 기존 댓글 리스트가 있으면 추가
    post.comments.push({
      idx: post.comments.length + 1,
      name,
      password,
      comment,
      createdDt: new Date().toISOString(),
    });
  } else {
    // 게시글에 댓글 정보가 없으면 리스트에 댓글 정보 추가
    post.comments = [
      {
        idx: 1,
        name,
        password,
        comment,
        createdDt: new Date().toISOString(),
      },
    ];
  }
  postService.updatePost(collection, id, post); // 업데이트하기. 업데이트 후에는 상세페이지도 다시 리다이렉트
  return res.redirect(`/detail/${id}`);
});

app.delete("/delete-comment", async (req, res) => {
  const { id, idx, password } = req.body;

  // 게시글(post)의 Comments 안에 있는 특정 댓글 데이터를 찾기
  const post = await collection.findOne(
    {
      _id: new ObjectId(id),
      comments: { $elemNatch: { idx: parseInt(idx), password } },
    },
    postService.projectionOption,
  );

  if (!post) { // 데이터가 없으면 isSuccess: false 주면서 종료
    return res.json({ isSuccess: false});
  }

  post.comments = post.comments.filter((comment) => comment.idx != idx); // 댓글 번호가 idx 이외인 것만 comments에 다시 할당 후 저장
  postService.updatePost(collection, id, post);
  return res.json({ isSuccess: true});
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

// 패스워드 체크
app.post("/check-password", async (req, res) => {
  // id, password 값을 가져옴
  const { id, password } = req.body;

  const post = await postService.getPostByIdAndPassword(collection, {
    // postService의 getPostByIdAndPassword() 함수를 사용해 게시글 데이터 확인
    id,
    password,
  });
  if (!post) {
    // 데이터가 있으면 isExist true, 없으면 isExist false
    return res.status(404).json({ isExist: false });
  } else {
    return res.json({ isExist: true });
  }
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
