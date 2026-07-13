package kr.co.xong.app;

import android.graphics.Color;
import android.os.Bundle;
import android.webkit.CookieManager;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;
import com.kakao.sdk.common.KakaoSdk;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 카카오톡 간편 로그인 SDK 초기화
        KakaoSdk.init(this, getString(R.string.kakao_app_key));
        // 애플 로그인: 콜백이 크로스사이트 form_post라 웹뷰 기본 정책에선 state 쿠키가 차단됨
        // (SameSite=None이어도 웹뷰는 서드파티 쿠키 별도 허용 필요) → 허용
        try {
            CookieManager.getInstance().setAcceptThirdPartyCookies(this.bridge.getWebView(), true);
        } catch (Exception ignored) {}
        // 엣지투엣지(안드15+)에서 시스템 상태바·내비바가 웹뷰를 덮지 않도록
        // 콘텐츠 뷰에 시스템바 인셋만큼 패딩을 적용 (3버튼/제스처 모두 실제 높이 반영)
        getWindow().getDecorView().setBackgroundColor(Color.parseColor("#000000"));
        final android.view.View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
    }
}
