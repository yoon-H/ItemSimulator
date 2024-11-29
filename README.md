# ItemSimulator

## 코드 컨벤션

https://github.com/yoon-H/ItemSimulator/wiki/Code-Convention

##  작업 로드맵

https://github.com/users/yoon-H/projects/3/views/2

## 질문과 답변

1. **암호화 방식**
    - 비밀번호를 DB에 저장할 때 Hash를 이용했는데, Hash는 단방향 암호화와 양방향 암호화 중 어떤 암호화 방식에 해당할까요?
      - A) 단방향 암호화로 암호화할 수 있지만 복호화는 할 수 없다. 
    - 비밀번호를 그냥 저장하지 않고 Hash 한 값을 저장 했을 때의 좋은 점은 무엇인가요?
      - A) 평문을 그대로 저장하면 database 내용이 유출되었을 때 사용자의 정보가 유출되어 보안에 문제가 생긴다.
2. **인증 방식**
    - JWT(Json Web Token)을 이용해 인증 기능을 했는데, 만약 Access Token이 노출되었을 경우 발생할 수 있는 문제점은 무엇일까요?
      - A) 다른 사람이 접근 토큰을 탈취해서 대신 로그인하여 사용할 수 있다.
    - 해당 문제점을 보완하기 위한 방법으로는 어떤 것이 있을까요?
      - A) access token에 만료기간을 두고, refresh token을 사용해서 재발급 받는 방식으로 해결할 수 있다. 혹은 토큰을 숨겨서 클라이언트 측에서 확인할 수 없도록 만든다.
3. **인증과 인가**
    - 인증과 인가가 무엇인지 각각 설명해 주세요.
      - A) 인증은 사용자가 서비스를 사용하려고 할 때 인증된 사람인지 검증하는 것이고, 인가는 특정 구역이나 서비스에 접근할 때 권한이 있는지 검사하는 것이다.
    - 아이템 시뮬레이터 API 구현 명세에서 인증을 필요로 하는 API와 그렇지 않은 API의 차이가 뭐라고 생각하시나요?
      - A) 인증을 필요로 하는 것은 사용자의 개인 정보가 담긴 내용을 주로 다루고, 그렇지 않은 것은 외부 사람도 접근할 수 있는 내용을 다룬다. 보안 중요성에 따라 달라질 것이다.
    - 아이템 생성, 수정 API는 인증을 필요로 하지 않는다고 했지만 사실은 어느 API보다도 인증이 필요한 API입니다. 왜 그럴까요?
      - A) 게임에 적용되는 아이템은 게임 자체에 영향을 줄 수 있는 매체여서 일반 사옹자에게는 허용되지 않고 관계자에게만 접근 가능한 기능이어야 합니다.
4. **Http Status Code**
    - 과제를 진행하면서 사용한 Http Status Code를 모두 나열하고, 각각이 의미하는 것과 어떤 상황에 사용했는지 작성해 주세요.
      - A)  - Status 200 : 성공적으로 요청을 처리했을 때 보낸다.
            - Status 400 : 유효성 검사나 다른 조건에 부합하지 않을 때 요청을 거부할 때 보낸다.  
5. **게임 경제**
    - 현재는 간편한 구현을 위해 캐릭터 테이블에 money라는 게임 머니 컬럼만 추가하였습니다.
        - 이렇게 되었을 때 어떠한 단점이 있을 수 있을까요?
          - A) 캐릭터마다 필요한 정보가 많아지면 캐릭터 테이블이 무거워진다. 
        - 이렇게 하지 않고 다르게 구현할 수 있는 방법은 어떤 것이 있을까요?
          - A) 캐릭터 정보 테이블을 따로 만들어서 관리한다.
    - 아이템 구입 시에 가격을 클라이언트에서 입력하게 하면 어떠한 문제점이 있을 수 있을까요?
      - A) 클라이언트가 보안 공격을 받았을 때 게임 내부 경제가 망가질 수 있다.
