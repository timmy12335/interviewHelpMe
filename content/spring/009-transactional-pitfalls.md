---
id: spring-009
category: spring
slug: transactional-pitfalls
title: "@Transactional 失效的常見情境"
difficulty: hard
tags: [Transactional, 交易失效, 自我呼叫]
source: original
---

# 題目

`@Transactional` 有哪些常見的失效情境？為什麼會失效？

## 核心答案

常見失效情境包括：（1）**自我呼叫**——同類別內方法 A 呼叫標了 @Transactional 的方法 B，B 的交易不生效（呼叫繞過了代理）；（2）**方法非 public**——@Transactional 只對 public 方法生效；（3）**異常被 catch 吞掉**——方法內把異常 catch 住沒有重新拋出，交易攔截器感知不到異常、不會回滾；（4）**拋出受檢異常**——預設只回滾 RuntimeException，受檢異常不回滾；（5）**在另一個執行緒執行**——交易綁定執行緒，新執行緒不在原交易裡；（6）**類別沒被 Spring 管理**——不是 Bean 就沒有代理；（7）**資料庫引擎不支援交易**（如 MyISAM）。這些失效的根源大多是「AOP 代理沒生效」或「回滾條件不滿足」。

## 詳細解析

**根源一：AOP 代理沒生效（呼叫沒經過代理）**

1. **自我呼叫（self-invocation）**：類別內部 `this.B()` 呼叫繞過代理，B 的 @Transactional 失效（見 [[006-aop-concept.md]]）。這是最常見的失效。解法——把 B 抽到另一個 Bean、或用 `AopContext.currentProxy()`、或自注入。
2. **方法不是 public**：Spring AOP 的交易只作用於 public 方法（protected/private/default 方法上的 @Transactional 被忽略）。因為代理機制的限制。
3. **類別沒被 Spring 管理**：如果這個物件是自己 new 的、不是容器裡的 Bean，就沒有代理，@Transactional 完全不起作用。

**根源二：回滾條件不滿足**

4. **異常被 catch 吞掉**：方法內部 try-catch 了異常但沒有重新拋出——交易攔截器是靠「方法拋出異常」來判斷要回滾的，異常被你吞了，攔截器以為方法正常返回，就提交而非回滾。
5. **拋出受檢異常**：預設只回滾 RuntimeException/Error，受檢異常不回滾（見 [[008-transactional-principle.md]]）。需 `rollbackFor = Exception.class`。
6. **rollbackFor 設定不當**：沒有正確配置哪些異常回滾。

**根源三：交易上下文丟失**

7. **在新執行緒中執行**：@Transactional 的交易綁定當前執行緒（ThreadLocal），如果方法內把 DB 操作丟到另一個執行緒（@Async、線程池、並行流），新執行緒沒有交易上下文，那些操作不在原交易裡。

**根源四：底層不支援**

8. **資料庫/引擎不支援交易**：如 MySQL 的 MyISAM 引擎不支援交易，@Transactional 自然無效（要用 InnoDB）。

## 面試回答方式

這題是高頻重點，最好按「失效的根源」分類來組織回答（而非零散列舉），這樣顯得有系統性——根源一「代理沒生效」（自我呼叫、非 public、非 Bean）、根源二「回滾條件不滿足」（異常被吞、受檢異常）、根源三「交易上下文丟失」（新執行緒）、根源四「底層不支援」（MyISAM）。其中「自我呼叫」和「異常被吞」是最常見、最該優先講的。能把每種失效歸因到「代理沒生效 or 回滾條件不滿足 or 上下文丟失」，展現你理解失效的本質而非死背清單，這是這題最能展現深度的地方。

## 常見追問

### 自我呼叫導致的交易失效具體怎麼解決？

**核心答案**：有幾種解法——（1）**把方法抽到另一個 Bean**：把標了 @Transactional 的方法 B 移到另一個 Service 中，A 透過注入這個 Service 來呼叫 B，這樣呼叫就經過了 B 所在 Bean 的代理，交易生效（最推薦、最清晰）；（2）**用 `AopContext.currentProxy()`**：在 A 中透過 `((當前類別) AopContext.currentProxy()).B()` 拿到當前 Bean 的代理再呼叫 B（需要開啟 `exposeProxy = true`）；（3）**自注入**：讓 Bean 注入自己（注入的是代理），用注入的代理引用去呼叫 B。最推薦第一種——它同時解決了「交易失效」和「職責劃分」兩個問題。

**詳細解析**：這幾種解法的共同思路都是「讓對 B 的呼叫經過代理，而不是走 this 直接呼叫真實物件」。第一種（抽到另一個 Bean）最好——因為自我呼叫交易失效往往也暗示了「這兩個方法可能該屬於不同的職責/類別」，把 B 抽出去既解決了交易問題，也讓程式碼職責更清晰，是「順便改善設計」的解法。第二種（AopContext.currentProxy）是「原地解決」——不改變類別結構，透過 Spring 提供的 `AopContext` 在執行期拿到當前 Bean 的代理（前提是配置 `@EnableAspectJAutoProxy(exposeProxy = true)` 把代理暴露到 ThreadLocal），然後用代理呼叫 B。但它讓程式碼和 Spring 的 AopContext 耦合、可讀性略差。第三種（自注入，`@Autowired private XxxService self;`）是讓 Bean 持有自己的代理引用，用 `self.B()` 呼叫。三種都能解決，但第一種在解決問題的同時改善了設計，通常是首選。理解「解法本質都是讓呼叫經過代理」，展現你理解問題根源而非死記解法。

**面試回答方式**：講出幾種解法（抽到另一個 Bean、AopContext.currentProxy、自注入），並點出它們的共同思路——「讓呼叫經過代理而非 this 直接呼叫」。推薦第一種並說明理由（同時改善職責劃分）。能講出解法的本質，展現你理解問題而非背答案。

### 為什麼異常被 catch 住交易就不回滾？如果 catch 後還想回滾怎麼辦？

**核心答案**：因為交易攔截器（AOP）是「從外面包住方法」的——它靠「感知到方法向外拋出了異常」來觸發回滾。如果你在方法內部把異常 try-catch 住了、沒有重新拋出，那麼從交易攔截器的視角看，這個方法是「正常返回」的（異常在方法內部被消化了、沒有拋到方法外），攔截器就會提交交易而非回滾。如果 catch 後仍想回滾，可以——（1）在 catch 塊中重新拋出異常（讓攔截器感知到）；（2）在 catch 塊中手動呼叫 `TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()` 把當前交易標記為「只能回滾」。

**詳細解析**：這個坑的根源是「交易攔截器在方法外層、只能看到方法有沒有向外拋異常」。想像交易攔截器包在方法外面：`try { 開啟交易; 執行方法; 提交 } catch(e) { 回滾 }`——它是靠捕捉方法拋出的異常來決定回滾的。如果你的方法內部自己 `try { ... } catch(e) { log(e); }` 把異常吞了，方法就正常返回了，外層的交易攔截器根本沒收到異常，自然提交。這在實務中很隱蔽——你可能好心地 catch 異常記個日誌，卻無意中讓交易在出錯時仍然提交、資料髒了。解法一是「重新拋出」——catch 記完日誌後 `throw e`（或包裝成 RuntimeException 拋出），讓攔截器感知。解法二是「手動標記回滾」——`TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()`，這會告訴交易管理器「這個交易最終必須回滾」，即使方法正常返回，攔截器提交時也會因為這個標記而改為回滾。理解「交易攔截器靠感知方法拋異常來回滾、吞了異常就感知不到」，是避免這個隱蔽坑的關鍵。

**面試回答方式**：講清楚根源——「交易攔截器在方法外層、靠感知方法拋出異常來回滾、異常被 catch 吞了就感知不到、以為正常返回就提交」。給出解法——「catch 後重新拋出、或手動 setRollbackOnly()」。能點出「好心 catch 記日誌卻導致交易該回滾卻提交」這個隱蔽坑，展現你有實戰踩坑經驗。

### @Transactional 標在 private 方法上為什麼無效？

**核心答案**：因為 Spring AOP 的交易增強是透過「代理」實現的——JDK 動態代理（Dynamic Proxy）只能代理介面中的方法（介面方法都是 public），CGLIB 透過生成子類別覆寫方法來增強、而 private 方法無法被子類別覆寫（private 方法不參與繼承/多型）。所以無論哪種代理方式，都無法攔截 private 方法的呼叫，@Transactional 標在 private 方法上就不會生效（Spring 會直接忽略）。此外 protected 和 default（package-private）方法在 CGLIB 下技術上可能被覆寫，但 Spring 的交易處理明確限定只作用於 public 方法。

**詳細解析**：這個限制的根源是「代理只能增強能被攔截的方法」。CGLIB 的原理是「生成目標類別的子類別、覆寫方法、在覆寫的方法中插入增強邏輯」（見 Java 核心的動態代理題）——但 private 方法是「類別私有的、不參與繼承」的，子類別根本無法覆寫它（子類別甚至看不到父類別的 private 方法），所以 CGLIB 無法攔截 private 方法。JDK 代理更是只能代理介面方法（都是 public）。因此 private 方法上的 @Transactional 從機制上就不可能生效。Spring 為了行為的一致和明確，直接規定交易只作用於 public 方法（即使 protected/default 在 CGLIB 下技術上可覆寫，Spring 也不對它們套用交易，避免「JDK 代理和 CGLIB 行為不一致」的困惑）。這也提醒——如果你發現一個標了 @Transactional 的方法交易沒生效，檢查它是不是 private（或被 private 方法內部呼叫），是排查交易失效的一個常見點。理解「代理無法攔截 private 方法所以交易失效」，展現你把交易失效和代理機制的限制連結起來理解。

**面試回答方式**：講出根源——「交易靠代理實現、CGLIB 靠覆寫方法增強而 private 方法不能被子類別覆寫、JDK 代理只能代理介面 public 方法、所以 private 方法無法被攔截、交易失效」。能補充「Spring 明確限定只作用於 public 方法（避免兩種代理行為不一致）」，展現你理解這個限制的機制根源。

## 相關

- [[006-aop-concept.md]]
- [[008-transactional-principle.md]]
- [[010-transaction-propagation.md]]
