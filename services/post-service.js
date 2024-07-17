// 글쓰기
async function writePost(collection, post) {
  // 글쓰기 함수
  // 생성일시와 조회수 삽입
  post.hits = 0;
  post.createdDt = new Date().toISOString(); // 날짜는 ISO 포맷으로 저장
  return await collection.insertOne(post);
}

module.exports = {
  writePost,
};
