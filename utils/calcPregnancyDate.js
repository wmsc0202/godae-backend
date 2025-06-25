export function calcPregnancyDate(date) {
    const pregnancyDate = new Date(date);
    const now = new Date();
    let trimester = 0;

    // 밀리초 차이 계산 (분자)
    const diffMs = now - pregnancyDate;
    
    // 1주를 밀리초로 계산 (분모)
    const weekMs = 1000 * 60 * 60 * 24 * 7;

    // 차이 주 수 계산 (버림하여 "완전히 지난 주" 기준)
    const weeks = Math.floor(diffMs/weekMs);

    if(1 <= weeks && weeks <= 13) 
        trimester = 1;
    else if(14 <= weeks && weeks <= 26) 
        trimester = 2;
    else if(27 <= weeks) 
        trimester = 3;

    return { trimester, weeks };
}