const paginator = require("../utils/paginator");

// 글쓰기
async function writePost(collection, post) {
  // 글쓰기 함수
  // 생성일시와 조회수 삽입
  post.hits = 0;
  post.createdDt = new Date().toISOString(); // 날짜는 ISO 포맷으로 저장
  return await collection.insertOne(post);
}

async function list(collection, page, search) {
  const perPage = 10;
  const query = { title: new RegExp(search, "i") }; // title이 search와 부분일치하는지 확인
  const cursor = collection
    .find(query, { limit: perPage, ski: (page - 1) * perPage })
    .sort({
      // limit은 10개만 가져온다는 의미, skip은 설정된 개수만큼 건너뛴다(skip)
      createdDt: -1, // 생성일 역순으로 정리
    });
  const totalCount = await collection.count(query);
  const posts = await cursor.toArray(); // 커서로 받아온 데이터를 리스트로 변경
  const paginatorObj = paginator({ totalCount, page, perPage: perPage }); // 페이지네이터 생성
}

module.exports = {
  list,
  writePost,
};
