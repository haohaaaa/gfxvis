# 第五章：交比（Cross Ratio）与射影不变量

这一章非常重要。

前面我们已经建立了一条完整的逻辑链：

$$ \text{线性空间} \longrightarrow \text{射影空间} \longrightarrow \text{射影变换} $$

并且知道射影变换具有如下形式：

$$ \boxed{ [\mathbf x]\longmapsto[H\mathbf x] } $$

其中 $H$ 是可逆矩阵。

当我们在射影直线 $\mathbb P^1$ 中使用仿射坐标时，它表现为：

$$ \boxed{ X'=\frac{aX+b}{cX+d} } $$

其中：

$$ ad-bc\neq0. $$

上一章还证明了，射影变换可以保持：

- 点与直线的关联关系（incidence）。
- 三点共线（collinearity）。
- 三线共点（concurrency）。
- 射影子空间的维数。

但它通常不保持长度、角度、平行性，甚至不保持普通线段之间的比例。

那么一个非常自然的问题就出现了：

既然普通的长度比例都不保持，射影变换究竟还能保持什么数值关系？

答案是：

$$ \boxed{ \text{Cross Ratio（交比）} } $$

交比是射影几何最基本、最重要的数值不变量之一。

这一章我们要弄清楚四件事：

1. 为什么两个点、三个点的普通比例不够。
2. 为什么四个共线点之间存在一种特殊的比例关系。
3. 为什么这个比例在任意射影变换下保持不变。
4. 为什么交比可以写成齐次坐标的行列式，并自然包含无穷远点。

# 1. 先从“什么是不变量”开始

我们先不研究交比。

假设有一个几何变换：

$$ T:S\to S. $$

其中 $S$ 表示某个几何空间。

如果一个几何量 $I$ 在变换前后满足：

$$ I(T(P_1),\ldots,T(P_k)) = I(P_1,\ldots,P_k), $$

那么就说：

$$ I $$

是这个变换的一个不变量（invariant）。

这里 $P_1,\ldots,P_k$ 是参与这个几何量的点。

## 例子一：平移保持距离

考虑普通实数轴上的平移：

$$ T(X)=X+5. $$

取两个点：

$$ A=1, \qquad B=4. $$

它们的距离：

$$ |B-A|=|4-1|=3. $$

变换以后：

$$ A'=6, \qquad B'=9. $$

距离：

$$ |B'-A'|=|9-6|=3. $$

所以距离是不变量。

## 例子二：缩放不保持距离，但保持距离比例

考虑：

$$ T(X)=2X. $$

取三个点：

$$ A=0,\qquad B=2,\qquad C=5. $$

原来的距离：

$$ |B-A|=2, $$

$$ |C-A|=5. $$

它们的比例：

$$ \frac{|B-A|}{|C-A|} = \frac25. $$

缩放以后：

$$ A'=0,\qquad B'=4,\qquad C'=10. $$

新的距离比例：

$$ \frac{|B'-A'|}{|C'-A'|} = \frac4{10} = \frac25. $$

距离本身改变了，但比例没有改变。

所以：

$$ \boxed{ \text{相似变换不一定保持长度，却保持长度比例} } $$

这提示我们：

> 当允许的变换越来越一般时，我们需要寻找更加复杂、但仍然保持不变的几何量。

# 2. 仿射变换保持什么比例？

考虑实数轴上的一般可逆仿射变换：

$$ \boxed{ T(X)=aX+b } $$

其中：

$$ a\neq0. $$

取三个不同的点：

$$ A=X_1,\qquad B=X_2,\qquad C=X_3. $$

我们先研究一个有向比例：

$$ R(A,B,C) = \frac{X_1-X_3}{X_2-X_3}. $$

这里的差值允许为负数，因此这是一个有向比例，不是单纯的长度比例。

现在变换三个点：

$$ X_i'=aX_i+b, \qquad i=1,2,3. $$

其中 $i$ 是点的编号。

变换后的比例：

$$ R' = \frac{X_1'-X_3'}{X_2'-X_3'}. $$

代入：

$$ R' = \frac{ (aX_1+b)-(aX_3+b) }{ (aX_2+b)-(aX_3+b) }. $$

化简：

$$ R' = \frac{ a(X_1-X_3) }{ a(X_2-X_3) }. $$

因为：

$$ a\neq0, $$

所以可以约去：

$$ R' = \frac{X_1-X_3}{X_2-X_3}. $$

因此：

$$ \boxed{ R'=R } $$

这说明：

$$ \boxed{ \text{仿射变换保持同一直线上的有向线段比例} } $$

这也解释了为什么仿射变换保持中点。

例如：

$$ M=\frac{A+B}{2} $$

经过仿射变换后：

$$ T(M) = a\frac{A+B}{2}+b. $$

另一方面：

$$ \frac{T(A)+T(B)}2 = \frac{aA+b+aB+b}{2} = a\frac{A+B}{2}+b. $$

所以：

$$ \boxed{ T\left(\frac{A+B}{2}\right) = \frac{T(A)+T(B)}2 } $$

中点仍然是中点。

# 3. 但一般射影变换不保持这种比例

现在我们考虑一个真正的分式线性变换：

$$ \boxed{ T(X)=\frac{X}{X+1} } $$

它对应齐次矩阵：

$$ H= \begin{bmatrix} 1&0\\ 1&1 \end{bmatrix}. $$

因为：

$$ \det H=1\neq0, $$

所以它确实定义了一个射影变换。

取三个点：

$$ A=0,\qquad B=1,\qquad C=2. $$

原来的有向比例：

$$ R = \frac{A-C}{B-C}. $$

代入：

$$ R = \frac{0-2}{1-2} = \frac{-2}{-1} = 2. $$

现在逐个变换。

第一个点：

$$ A' = T(0) = \frac0{0+1} = 0. $$

第二个点：

$$ B' = T(1) = \frac1{1+1} = \frac12. $$

第三个点：

$$ C' = T(2) = \frac2{2+1} = \frac23. $$

新的比例：

$$ R' = \frac{A'-C'}{B'-C'}. $$

代入：

$$ R' = \frac{0-\frac23}{\frac12-\frac23}. $$

先计算分母：

$$ \frac12-\frac23 = \frac36-\frac46 = -\frac16. $$

于是：

$$ R' = \frac{-\frac23}{-\frac16} = 4. $$

所以：

$$ \boxed{ R=2,\qquad R'=4 } $$

比例发生了变化！

这说明：

$$ \boxed{ \text{一般射影变换不保持三个点之间的普通有向比例} } $$

那是不是意味着，再也找不到类似的数值不变量了？

不是。

关键是：我们需要引入第四个点。

# 4. 四个共线点与交比的定义

现在正式引入交比。

考虑射影直线上的四个互不相同的点：

$$ A,\quad B,\quad C,\quad D. $$

先假设它们全都在同一张有限仿射坐标图中。

使用坐标：

$$ A=X_1, $$

$$ B=X_2, $$

$$ C=X_3, $$

$$ D=X_4. $$

我们定义它们的交比为：

$$ \boxed{ \operatorname{CR}(A,B;C,D) = \frac{(X_1-X_3)(X_2-X_4)} {(X_1-X_4)(X_2-X_3)} } $$

这里：

$$ \operatorname{CR} $$

是 Cross Ratio 的缩写。

注意符号：

$$ \operatorname{CR}(A,B;C,D). $$

其中分号强调四个点被写成两对，但四个点的顺序仍然重要。

不同教材可能采用不同的点序约定。我们这一章始终使用上面这个定义。

# 5. 交比其实是“两个有向比例的比值”

把公式重新分组：

$$ \operatorname{CR}(A,B;C,D) = \frac{ \frac{X_1-X_3}{X_2-X_3} }{ \frac{X_1-X_4}{X_2-X_4} }. $$

用点的名字写：

$$ \boxed{ \operatorname{CR}(A,B;C,D) = \frac{ \frac{A-C}{B-C} }{ \frac{A-D}{B-D} } } $$

这里 $A-C$ 等记号表示该仿射坐标下的有向差值。

因此我们可以把交比理解为：

> 先选择 $C$ 作为参考，比较 $A,B$ 相对于 $C$ 的比例；再选择 $D$ 作为参考，计算另一个比例；最后用两个比例相除。

这就是“交比”最直接的代数理解。

它不是普通的两个长度之比。

而是：

$$ \boxed{ \text{比例的比例} } $$

这层结构恰好足够抵消一般分式线性变换引入的额外缩放因子。

下面我们会严格证明。

# 6. 第一个交比计算例子

取四个点：

$$ A=0,\qquad B=1,\qquad C=2,\qquad D=3. $$

代入定义：

$$ \operatorname{CR}(A,B;C,D) = \frac{(0-2)(1-3)} {(0-3)(1-2)}. $$

分别计算分子：

$$ (0-2)(1-3) = (-2)(-2) = 4. $$

分母：

$$ (0-3)(1-2) = (-3)(-1) = 3. $$

所以：

$$ \boxed{ \operatorname{CR}(0,1;2,3) = \frac43 } $$

以后我们要证明，无论使用哪个可逆射影变换，只要把这四个点一起变换，它们的交比始终是：

$$ \frac43. $$

即使四个点的新坐标完全不一样。

# 7. 先通过数值例子验证交比不变

仍然采用刚才的射影变换：

$$ T(X)=\frac{X}{X+1}. $$

原来四个点：

$$ A=0,\quad B=1,\quad C=2,\quad D=3. $$

我们已经算出：

$$ A'=0, $$

$$ B'=\frac12, $$

$$ C'=\frac23. $$

第四个点：

$$ D' = T(3) = \frac3{3+1} = \frac34. $$

所以变换后的四个点为：

$$ 0,\quad\frac12,\quad\frac23,\quad\frac34. $$

现在计算新的交比：

$$ \operatorname{CR}(A',B';C',D') = \frac{ \left(0-\frac23\right) \left(\frac12-\frac34\right) }{ \left(0-\frac34\right) \left(\frac12-\frac23\right) }. $$

逐个计算：

$$ 0-\frac23=-\frac23, $$

$$ \frac12-\frac34=-\frac14, $$

$$ 0-\frac34=-\frac34, $$

$$ \frac12-\frac23=-\frac16. $$

所以：

$$ \operatorname{CR}(A',B';C',D') = \frac{ \left(-\frac23\right)\left(-\frac14\right) }{ \left(-\frac34\right)\left(-\frac16\right) }. $$

分子：

$$ \frac23\cdot\frac14 = \frac16. $$

分母：

$$ \frac34\cdot\frac16 = \frac18. $$

因此：

$$ \operatorname{CR}(A',B';C',D') = \frac{\frac16}{\frac18}. $$

最后：

$$ \boxed{ \operatorname{CR}(A',B';C',D') = \frac43 } $$

和原来的：

$$ \boxed{ \operatorname{CR}(A,B;C,D) = \frac43 } $$

完全一致。

观察这个变换对四个点的影响

变换：$T_t(X)=\frac{X}{1+tX}$

t = 1.00

原始交比

## 1.333333…

变换后交比

## 1.333333

拖动滑块改变射影变换强度。四个点会重新分布，但交比始终保持 $4/3$。

这不是这个特殊变换的巧合。

而是所有可逆射影变换都满足的定理。

# 8. 严格证明：为什么交比在分式线性变换下不变？

现在我们正式推导。

## 8.1 符号约定

设：

$$ T(X)=\frac{aX+b}{cX+d}, $$

其中：

$$ a,b,c,d\in\mathbb R, $$

并且：

$$ \Delta=ad-bc\neq0. $$

这里：

$$ \Delta $$

就是对应矩阵

$$ H= \begin{bmatrix} a&b\\ c&d \end{bmatrix} $$

的行列式。

先考虑所有相关点及其像都在所选有限仿射图中的情况，因此分母不为零。

我们取任意两个不同的有限点：

$$ X_i,\quad X_j. $$

它们变换后：

$$ X_i' = \frac{aX_i+b}{cX_i+d}, $$

$$ X_j' = \frac{aX_j+b}{cX_j+d}. $$

我们的第一步不是直接计算四点交比，而是先计算：

$$ X_i'-X_j'. $$

因为交比本身就是由点的坐标差构造出来的。

## 8.2 计算两个变换后坐标的差

根据定义：

$$ X_i'-X_j' = \frac{aX_i+b}{cX_i+d} - \frac{aX_j+b}{cX_j+d}. $$

通分：

$$ X_i'-X_j' = \frac{ (aX_i+b)(cX_j+d) - (aX_j+b)(cX_i+d) }{ (cX_i+d)(cX_j+d) }. $$

展开分子第一项：

$$ (aX_i+b)(cX_j+d) = acX_iX_j+adX_i+bcX_j+bd. $$

展开第二项：

$$ (aX_j+b)(cX_i+d) = acX_iX_j+adX_j+bcX_i+bd. $$

两者相减：

$$ \begin{aligned} &acX_iX_j+adX_i+bcX_j+bd\\ &\quad-acX_iX_j-adX_j-bcX_i-bd. \end{aligned} $$

消去相同项：

$$ =adX_i+bcX_j-adX_j-bcX_i. $$

重新分组：

$$ =ad(X_i-X_j)-bc(X_i-X_j). $$

提取公共因子：

$$ =(ad-bc)(X_i-X_j). $$

因此我们得到：

$$ \boxed{ X_i'-X_j' = \frac{ \Delta(X_i-X_j) }{ (cX_i+d)(cX_j+d) } } $$

这就是整个交比不变性证明中最关键的等式。

你可以看到，两点之间的差不只是乘上一个固定常数。

它还会受到这两个点各自分母的影响：

$$ (cX_i+d)(cX_j+d). $$

这正是为什么普通长度比例一般不会保持。

但交比会让这些因素全部抵消。

## 8.3 把它代入四点交比

定义：

$$ R= \frac{ (X_1-X_3)(X_2-X_4) }{ (X_1-X_4)(X_2-X_3) }. $$

变换以后：

$$ R' = \frac{ (X_1'-X_3')(X_2'-X_4') }{ (X_1'-X_4')(X_2'-X_3') }. $$

为了简化书写，定义：

$$ q_i=cX_i+d, \qquad i=1,2,3,4. $$

那么刚才推导的公式可以写成：

$$ X_i'-X_j' = \frac{\Delta(X_i-X_j)}{q_iq_j}. $$

现在代入四个差值。

分子的第一项：

$$ X_1'-X_3' = \frac{\Delta(X_1-X_3)}{q_1q_3}. $$

分子的第二项：

$$ X_2'-X_4' = \frac{\Delta(X_2-X_4)}{q_2q_4}. $$

分母的第一项：

$$ X_1'-X_4' = \frac{\Delta(X_1-X_4)}{q_1q_4}. $$

分母的第二项：

$$ X_2'-X_3' = \frac{\Delta(X_2-X_3)}{q_2q_3}. $$

于是：

$$ R' = \frac{ \frac{\Delta(X_1-X_3)}{q_1q_3} \frac{\Delta(X_2-X_4)}{q_2q_4} }{ \frac{\Delta(X_1-X_4)}{q_1q_4} \frac{\Delta(X_2-X_3)}{q_2q_3} }. $$

整理分子：

$$ = \frac{ \frac{ \Delta^2(X_1-X_3)(X_2-X_4) }{ q_1q_2q_3q_4 } }{ \frac{ \Delta^2(X_1-X_4)(X_2-X_3) }{ q_1q_2q_3q_4 } }. $$

注意分子分母出现了完全相同的因子：

$$ \frac{\Delta^2}{q_1q_2q_3q_4}. $$

因此它们全部抵消。

最后得到：

$$ R' = \frac{ (X_1-X_3)(X_2-X_4) }{ (X_1-X_4)(X_2-X_3) }. $$

而右边正好就是：

$$ R. $$

所以：

$$ \boxed{ R'=R } $$

或者完整写成：

$$ \boxed{ \operatorname{CR}(T(A),T(B);T(C),T(D)) = \operatorname{CR}(A,B;C,D) } $$

这就是交比的射影不变性定理。

到这里，我们已经在有限仿射坐标范围内完成了证明。

接下来我们要把这个定理提升到真正的射影空间，并且消除“分母不为零”的限制。

# 9. 交比与齐次坐标：真正的射影定义

前面的交比公式：

$$ \operatorname{CR}(A,B;C,D) = \frac{(X_1-X_3)(X_2-X_4)} {(X_1-X_4)(X_2-X_3)} $$

仍然使用了普通仿射坐标 $X_i$。

这就留下了一个问题：

如果四个点中有一个是无穷远点，我们应该如何计算交比？

例如：

$$ A=[0:1], $$

$$ B=[1:1], $$

$$ C=[2:1], $$

$$ D=[1:0]. $$

前三个点分别对应普通实数：

$$ 0,\quad1,\quad2. $$

但第四个点：

$$ D=[1:0] $$

是无穷远点。

我们不能直接把它当作普通实数代入。

因此需要一个完全使用齐次坐标的交比公式。

而且你会看到，这个公式居然只需要一个非常熟悉的线性代数运算：

$$ \boxed{\text{行列式}} $$

## 9.1 从 $\mathbb P^1$ 的定义重新开始

设四个不同的射影点为：

$$ P_i=[\mathbf p_i], \qquad i=1,2,3,4. $$

这里：

$$ \mathbf p_i= \begin{bmatrix} x_i\\w_i \end{bmatrix} \in\mathbb R^2\setminus\{\mathbf0\}. $$

注意我们现在不要求：

$$ w_i\neq0. $$

因此允许无穷远点。

对于任意两个点 $P_i,P_j$，定义：

$$ \Delta\_{ij} = \det \begin{bmatrix} x_i&x_j\\ w_i&w_j \end{bmatrix}. $$

展开二阶行列式：

$$ \boxed{ \Delta\_{ij}=x_iw_j-x_jw_i } $$

这里的 $\Delta\_{ij}$ 是两个齐次代表向量的行列式，不要与上一节表示变换矩阵行列式的 $\Delta$ 混淆。

现在我们用这些行列式定义交比：

$$ \boxed{ \operatorname{CR}(P_1,P_2;P_3,P_4) = \frac{ \Delta\_{13}\Delta\_{24} }{ \Delta\_{14}\Delta\_{23} } } $$

这就是交比的齐次坐标形式。

对于四个互不相同的射影点，分母中的两个行列式都不为零，所以公式有定义。

# 10. 为什么这个行列式公式等价于前面的公式？

我们一步一步验证。

如果所有点都是有限点，那么可以选择标准齐次代表：

$$ \mathbf p_i= \begin{bmatrix} X_i\\1 \end{bmatrix}. $$

于是：

$$ \Delta\_{ij} = \det \begin{bmatrix} X_i&X_j\\ 1&1 \end{bmatrix}. $$

展开：

$$ \Delta\_{ij} = X_i\cdot1-X_j\cdot1. $$

所以：

$$ \boxed{ \Delta\_{ij}=X_i-X_j } $$

现在代入齐次交比公式：

$$ \operatorname{CR}(P_1,P_2;P_3,P_4) = \frac{ \Delta\_{13}\Delta\_{24} }{ \Delta\_{14}\Delta\_{23} }. $$

得到：

$$ = \frac{ (X_1-X_3)(X_2-X_4) }{ (X_1-X_4)(X_2-X_3) }. $$

这恰好就是前面使用的仿射交比。

因此：

$$ \boxed{ \text{仿射交比公式是齐次行列式公式的特殊情况} } $$

这也体现了我们之前建立的关系：

$$ \text{仿射几何} \subset \text{射影几何}. $$

# 11. 为什么齐次交比不依赖于代表向量？

这一步非常关键。

既然射影点本身是等价类，那么：

$$ \mathbf p_i $$

和：

$$ \lambda_i\mathbf p_i $$

必须给出同一个交比，其中：

$$ \lambda_i\neq0. $$

这里的四个缩放系数：

$$ \lambda_1,\lambda_2,\lambda_3,\lambda_4 $$

可以彼此不同。

现在考虑：

$$ \Delta\_{ij} = \det[\mathbf p_i\ \mathbf p_j]. $$

如果改用新的齐次代表：

$$ \widetilde{\mathbf p}\_i=\lambda_i\mathbf p_i, $$

那么：

$$ \widetilde{\Delta}\_{ij} = \det[ \lambda_i\mathbf p_i\ \lambda_j\mathbf p_j ]. $$

根据行列式对每一列的线性性：

$$ \widetilde{\Delta}\_{ij} = \lambda_i\lambda_j \det[\mathbf p_i\ \mathbf p_j]. $$

所以：

$$ \boxed{ \widetilde{\Delta}\_{ij} = \lambda_i\lambda_j\Delta\_{ij} } $$

现在计算新的交比：

$$ \widetilde R = \frac{ \widetilde{\Delta}\_{13} \widetilde{\Delta}\_{24} }{ \widetilde{\Delta}\_{14} \widetilde{\Delta}\_{23} }. $$

代入：

$$ \widetilde R = \frac{ (\lambda_1\lambda_3\Delta\_{13}) (\lambda_2\lambda_4\Delta\_{24}) }{ (\lambda_1\lambda_4\Delta\_{14}) (\lambda_2\lambda_3\Delta\_{23}) }. $$

把系数集中：

$$ \widetilde R = \frac{ \lambda_1\lambda_2\lambda_3\lambda_4 }{ \lambda_1\lambda_2\lambda_3\lambda_4 } \cdot \frac{\Delta\_{13}\Delta\_{24}} {\Delta\_{14}\Delta\_{23}}. $$

因为所有 $\lambda_i$ 都不为零，所以它们完全抵消。

最终：

$$ \boxed{ \widetilde R=R } $$

这说明交比真正属于四个射影点，而不是属于我们任意选择的四个坐标向量。

从数学上说：

$$ \boxed{ \text{交比在射影等价类上是良定义的} } $$

这一点非常重要。

# 12. 用齐次坐标重新证明交比的射影不变性

现在我们可以给出一个比前面的分式计算更简洁、更本质的证明。

设：

$$ H= \begin{bmatrix} a&b\\ c&d \end{bmatrix} \in GL(2,\mathbb R). $$

并且：

$$ \mathbf p_i'=H\mathbf p_i. $$

我们考虑变换后两个向量组成的行列式：

$$ \Delta\_{ij}' = \det[ \mathbf p_i'\ \mathbf p_j' ]. $$

代入：

$$ \Delta\_{ij}' = \det[ H\mathbf p_i\ H\mathbf p_j ]. $$

由于：

$$ [ H\mathbf p_i\ H\mathbf p_j ] = H[ \mathbf p_i\ \mathbf p_j ], $$

因此：

$$ \Delta\_{ij}' = \det\left( H[ \mathbf p_i\ \mathbf p_j ] \right). $$

利用行列式的乘法性质：

$$ \det(AB)=\det A\det B, $$

得到：

$$ \Delta\_{ij}' = \det H \cdot \det[ \mathbf p_i\ \mathbf p_j ]. $$

所以：

$$ \boxed{ \Delta\_{ij}'=(\det H)\Delta\_{ij} } $$

现在计算变换后的交比：

$$ R' = \frac{ \Delta\_{13}'\Delta\_{24}' }{ \Delta\_{14}'\Delta\_{23}' }. $$

代入：

$$ R' = \frac{ (\det H)\Delta\_{13} (\det H)\Delta\_{24} }{ (\det H)\Delta\_{14} (\det H)\Delta\_{23} }. $$

整理：

$$ R' = \frac{ (\det H)^2 }{ (\det H)^2 } \cdot \frac{ \Delta\_{13}\Delta\_{24} }{ \Delta\_{14}\Delta\_{23} }. $$

因为 $H$ 可逆：

$$ \det H\neq0. $$

所以：

$$ \boxed{ R'=R } $$

证明完成。

这个证明比前面更加漂亮，因为：

- 不需要引入仿射坐标；
- 不需要做透视除法；
- 不需要假设 $w\neq0$；
- 无穷远点自动包含在内；
- 直接利用线性代数性质。

这也再次说明：

$$ \boxed{ \text{很多复杂的射影几何结论，在底层线性空间中反而非常简单} } $$

# 13. 含有无穷远点的交比

现在回到刚才的问题。

取：

$$ A=[0:1], $$

$$ B=[1:1], $$

$$ C=[2:1], $$

$$ D=[1:0]. $$

其中 $D$ 是无穷远点。

我们计算：

$$ \operatorname{CR}(A,B;C,D). $$

根据定义：

$$ R= \frac{ \Delta\_{AC}\Delta\_{BD} }{ \Delta\_{AD}\Delta\_{BC} }. $$

逐项计算。

第一个：

$$ \Delta\_{AC} = \det \begin{bmatrix} 0&2\\ 1&1 \end{bmatrix} = -2. $$

第二个：

$$ \Delta\_{BD} = \det \begin{bmatrix} 1&1\\ 1&0 \end{bmatrix} = -1. $$

第三个：

$$ \Delta\_{AD} = \det \begin{bmatrix} 0&1\\ 1&0 \end{bmatrix} = -1. $$

第四个：

$$ \Delta\_{BC} = \det \begin{bmatrix} 1&2\\ 1&1 \end{bmatrix} = -1. $$

所以：

$$ R = \frac{(-2)(-1)}{(-1)(-1)}. $$

因此：

$$ \boxed{ \operatorname{CR}(0,1;2,\infty)=2 } $$

这非常有意思。

我们没有进行任何除以零的操作。

无穷远点仅仅用：

$$ [1:0] $$

表示。

整个计算完全合法。

# 14. 无穷远点会让交比公式变简单

我们可以进一步推导一个常用公式。

假设四个点为：

$$ A,\quad B,\quad C,\quad \infty. $$

前三个点是有限实数。

我们选择齐次代表：

$$ \mathbf p_A= \begin{bmatrix} A\\1 \end{bmatrix}, \qquad \mathbf p_B= \begin{bmatrix} B\\1 \end{bmatrix}, $$

$$ \mathbf p_C= \begin{bmatrix} C\\1 \end{bmatrix}, \qquad \mathbf p\_\infty= \begin{bmatrix} 1\\0 \end{bmatrix}. $$

计算：

$$ \Delta\_{AC}=A-C, $$

$$ \Delta\_{B\infty}=-1, $$

$$ \Delta\_{A\infty}=-1, $$

$$ \Delta\_{BC}=B-C. $$

于是：

$$ \operatorname{CR}(A,B;C,\infty) = \frac{(A-C)(-1)}{(-1)(B-C)}. $$

约去：

$$ -1, $$

得到：

$$ \boxed{ \operatorname{CR}(A,B;C,\infty) = \frac{A-C}{B-C} } $$

注意我们在第二节已经计算过这个比例！

它正是普通仿射几何中的有向比例。

因此我们发现一个特别深刻的事实：

$$ \boxed{ \text{仿射三点比例，可以视为第四个点位于无穷远时的交比} } $$

换句话说：

交比把仿射比例推广成了一个不依赖于固定无穷远点的射影不变量。

# 15. 为什么仿射变换保持比例，而一般射影变换不保持？

现在终于能用一个统一的射影观点回答这个问题。

普通仿射比例：

$$ \frac{A-C}{B-C} $$

其实可以写成：

$$ \operatorname{CR}(A,B;C,\infty). $$

由于交比总是射影不变，因此：

$$ \operatorname{CR}(T(A),T(B);T(C),T(\infty)) = \operatorname{CR}(A,B;C,\infty). $$

注意最后那个点是：

$$ T(\infty), $$

而不一定是：

$$ \infty. $$

对于仿射变换：

$$ T(X)=aX+b, $$

无穷远点保持不变：

$$ T(\infty)=\infty. $$

所以：

$$ \operatorname{CR}(T(A),T(B);T(C),\infty) = \operatorname{CR}(A,B;C,\infty). $$

换成仿射比例：

$$ \boxed{ \frac{T(A)-T(C)}{T(B)-T(C)} = \frac{A-C}{B-C} } $$

因此仿射比例保持。

但一般射影变换可能满足：

$$ T(\infty)\neq\infty. $$

这时候交比虽然仍然保持，普通仿射比例却不一定保持。

所以：

$$ \boxed{ \text{仿射比例不变性} = \text{交比不变性} + \text{无穷远点保持不变} } $$

这个结论非常值得记住。

它把两个不同几何体系中的不变量真正联系起来了。

# 16. 交比不仅属于 $\mathbb P^1$，也属于 $\mathbb P^2$、$\mathbb P^3$

目前我们使用的齐次点都是：

$$ [x:w]\in\mathbb P^1. $$

那么在：

$$ \mathbb P^2 $$

或者：

$$ \mathbb P^3 $$

中，交比还存在吗？

答案是：

$$ \boxed{\text{存在，但通常要求四个点共线}} $$

这是因为一条射影直线本身就是一个 $\mathbb P^1$。

下面我们严格说明。

## 16.1 任意射影直线都可以参数化

设：

$$ L\subseteq\mathbb P^n $$

是一条射影直线。

根据我们第三章学过的定义，它对应底层：

$$ \mathbb R^{n+1} $$

中的一个二维线性子空间：

$$ W. $$

选择 $W$ 的一组基：

$$ \mathbf u,\mathbf v. $$

因为它们是基，所以线性无关。

那么直线上的任意一个射影点都可以写成：

$$ P=[s\mathbf u+t\mathbf v]. $$

其中：

$$ (s,t)\neq(0,0). $$

注意：

$$ [s\mathbf u+t\mathbf v] $$

和：

$$ [\lambda s\mathbf u+\lambda t\mathbf v] $$

表示同一个射影点。

因此参数：

$$ [s:t] $$

本身就是一个 $\mathbb P^1$ 中的射影点。

于是：

$$ \boxed{ \mathbb P(W)\cong\mathbb P^1 } $$

所以任何射影直线，无论嵌入多高维的射影空间，都可以用两个齐次参数表示。

# 17. 在任意射影直线上定义交比

设直线 $L$ 上有四个不同的点：

$$ P_i=[s_i\mathbf u+t_i\mathbf v], \qquad i=1,2,3,4. $$

其中 $\mathbf u,\mathbf v$ 是刚才选择的基。

定义二维参数向量：

$$ \mathbf q_i= \begin{bmatrix} s_i\\t_i \end{bmatrix}. $$

再定义：

$$ \Delta\_{ij} = \det \begin{bmatrix} s_i&s_j\\ t_i&t_j \end{bmatrix}. $$

即：

$$ \Delta\_{ij}=s_it_j-s_jt_i. $$

那么四个点的交比就是：

$$ \boxed{ \operatorname{CR}(P_1,P_2;P_3,P_4) = \frac{ \Delta\_{13}\Delta\_{24} }{ \Delta\_{14}\Delta\_{23} } } $$

这和 $\mathbb P^1$ 中的公式完全相同。

## 为什么换一组基也不会改变交比？

假设我们把：

$$ \mathbf u,\mathbf v $$

换成另一组基：

$$ \widetilde{\mathbf u},\widetilde{\mathbf v}. $$

两组基之间一定存在一个可逆 $2\times2$ 矩阵 $M$，使得：

$$ [\widetilde{\mathbf u}\ \widetilde{\mathbf v}] = [\mathbf u\ \mathbf v]M. $$

相应地，同一个向量的参数坐标满足：

$$ \widetilde{\mathbf q}\_i=M^{-1}\mathbf q_i. $$

因此：

$$ \begin{aligned} \widetilde{\Delta}\_{ij} &= \det[ M^{-1}\mathbf q_i\ M^{-1}\mathbf q_j ]\\ &= \det(M^{-1}) \det[ \mathbf q_i\ \mathbf q_j ]\\ &= \det(M^{-1})\Delta\_{ij}. \end{aligned} $$

而交比的分子分母都包含两个这样的因子。

所以它们会抵消：

$$ \boxed{ \widetilde R=R } $$

因此交比不依赖我们如何参数化这条射影直线。

这意味着：

$$ \boxed{ \text{交比是四个共线射影点自身的几何量} } $$

它不是某一组特定坐标产生的人为数字。

# 18. 为什么高维射影变换也保持交比？

假设：

$$ H\in GL(n+1,\mathbb R). $$

它把直线：

$$ L=\mathbb P(W) $$

映射成：

$$ L'=\mathbb P(H(W)). $$

原来的点：

$$ P_i=[s_i\mathbf u+t_i\mathbf v] $$

经过变换后：

$$ P_i' = [H(s_i\mathbf u+t_i\mathbf v)]. $$

利用线性性：

$$ P_i' = [s_iH\mathbf u+t_iH\mathbf v]. $$

由于 $H$ 可逆，原来线性无关的 $\mathbf u,\mathbf v$ 经过变换后仍然线性无关。

所以：

$$ H\mathbf u,\quad H\mathbf v $$

构成新直线对应二维子空间的一组基。

注意在这组新基下，点的参数仍然是：

$$ [s_i:t_i]. $$

因此我们计算交比时用到的全部二维参数没有改变。

所以：

$$ \boxed{ \operatorname{CR}(P_1',P_2';P_3',P_4') = \operatorname{CR}(P_1,P_2;P_3,P_4) } $$

结论：

$$ \boxed{ \mathbb P^n \text{ 中任意四个共线点的交比，在射影变换下保持不变} } $$

这也是计算机视觉中交比的基础。

# 19. 一个重要的特殊交比：调和四点组

接下来我们研究交比的一个经典特殊值：

$$ \boxed{-1} $$

如果四个不同的共线射影点满足：

$$ \operatorname{CR}(A,B;C,D)=-1, $$

那么称它们按照该顺序构成一个：

$$ \boxed{ \text{Harmonic Range} } $$

中文通常叫：

调和点列或调和四点组。

## 具体例子

取：

$$ A=-1, $$

$$ B=1, $$

$$ C=0, $$

$$ D=\infty. $$

根据无穷远点交比公式：

$$ \operatorname{CR}(A,B;C,\infty) = \frac{A-C}{B-C}. $$

代入：

$$ = \frac{-1-0}{1-0}. $$

所以：

$$ \boxed{ \operatorname{CR}(-1,1;0,\infty)=-1 } $$

这里有一个几何事实：

$$ C=0 $$

恰好是 $A=-1$ 与 $B=1$ 的中点。

所以我们得到：

$$ \boxed{ \operatorname{CR}(A,B;M,\infty)=-1 } $$

其中：

$$ M=\frac{A+B}{2} $$

是 $A,B$ 的仿射中点。

这意味着：

仿射几何中的中点关系，可以转化成射影几何中的调和关系。

但要注意，两者并不是完全一样的概念。

因为一般射影变换并不保持指定的无穷远点。

它保持的是完整的四点调和关系。

# 20. 调和关系为什么比“中点”更一般？

我们用之前的变换：

$$ T(X)=\frac{X}{X+2} $$

做一个例子。

它对应可逆矩阵：

$$ H= \begin{bmatrix} 1&0\\ 1&2 \end{bmatrix}, $$

行列式为：

$$ \det H=2\neq0. $$

考虑调和四点：

$$ A=-1,\quad B=1,\quad C=0,\quad D=\infty. $$

逐个变换。

对于 $A$：

$$ A'=T(-1)=\frac{-1}{-1+2}=-1. $$

对于 $B$：

$$ B'=T(1)=\frac1{1+2}=\frac13. $$

对于 $C$：

$$ C'=T(0)=0. $$

而对于无穷远点，使用齐次坐标：

$$ D=[1:0]. $$

矩阵作用后：

$$ H \begin{bmatrix} 1\\0 \end{bmatrix} = \begin{bmatrix} 1\\1 \end{bmatrix}. $$

所以：

$$ D'=1. $$

四个点变成：

$$ A'=-1,\quad B'=\frac13,\quad C'=0,\quad D'=1. $$

注意：

$$ C'=0 $$

已经不是 $A',B'$ 的中点。

因为它们的中点是：

$$ \frac{-1+\frac13}{2} = -\frac13. $$

但计算交比：

$$ \operatorname{CR}\left(-1,\frac13;0,1\right) = \frac{ (-1-0)\left(\frac13-1\right) }{ (-1-1)\left(\frac13-0\right) }. $$

化简：

$$ = \frac{ (-1)\left(-\frac23\right) }{ (-2)\left(\frac13\right) }. $$

所以：

$$ = \frac{\frac23}{-\frac23} = -1. $$

因此：

$$ \boxed{ \operatorname{CR}(A',B';C',D')=-1 } $$

中点关系消失了，但调和关系仍然存在。

这非常形象地展示了：

$$ \boxed{ \text{射影不变量比仿射不变量更能适应一般透视变形} } $$

# 21. 改变四个点的顺序，会改变交比吗？

会。

交比不是四个点组成的无序集合的属性，而是有序四元组的属性。

我们定义：

$$ r=\operatorname{CR}(A,B;C,D). $$

交换前两个点：

$$ \operatorname{CR}(B,A;C,D) = \frac1r. $$

交换中间两个点，会得到：

$$ \operatorname{CR}(A,C;B,D) = 1-r. $$

通过不同排列，最多得到六种不同的数值：

$$ \boxed{ r,\quad \frac1r,\quad 1-r,\quad \frac1{1-r},\quad \frac{r}{r-1},\quad \frac{r-1}{r} } $$

某些特殊的 $r$ 会使这些数值重复。

所以看到两本教材的交比公式不一样时，首先应该检查：

> 它们是不是采用了不同的四点顺序约定？

例如我们使用：

$$ \operatorname{CR}(0,1;2,3)=\frac43. $$

如果交换 $A,B$，就得到：

$$ \operatorname{CR}(1,0;2,3)=\frac34. $$

所以二者并不矛盾。

# 22. 为什么恰好需要四个点？这是交比最深刻的性质之一

现在进入一个非常值得理解的结论：

$$ \boxed{ \mathbb P^1 \text{ 上任意三个不同的点，可以通过唯一的射影变换映射到另外三个指定的不同点} } $$

这句话有两个要求：

1. 原来的三个点互不相同；
2. 目标的三个点也互不相同，并且给定对应顺序。

为什么呢？

我们从构造一个具体的变换开始。

## 22.1 把任意三个点送到 $0,1,\infty$

先假设三个点都是有限坐标：

$$ A=a,\qquad B=b,\qquad C=c, $$

其中：

$$ a,b,c $$

两两不相等。

定义：

$$ \boxed{ F(X)= \frac{(X-a)(b-c)} {(X-c)(b-a)} } $$

现在验证。

对于 $A=a$：

$$ F(a) = \frac{(a-a)(b-c)} {(a-c)(b-a)} = 0. $$

所以：

$$ F(A)=0. $$

对于 $B=b$：

$$ F(b) = \frac{(b-a)(b-c)} {(b-c)(b-a)} = 1. $$

所以：

$$ F(B)=1. $$

对于 $C=c$，分母为零而分子不为零，所以在射影直线上：

$$ F(C)=\infty. $$

因此：

$$ \boxed{ (A,B,C) \longmapsto (0,1,\infty) } $$

我们确实构造出了这样的射影变换。

## 22.2 这个变换为什么可逆？

把 $F$ 改写成：

$$ F(X)=\frac{\alpha X+\beta}{\gamma X+\delta}, $$

其中：

$$ \alpha=b-c, $$

$$ \beta=-a(b-c), $$

$$ \gamma=b-a, $$

$$ \delta=-c(b-a). $$

对应矩阵：

$$ H_F= \begin{bmatrix} b-c&-a(b-c)\\ b-a&-c(b-a) \end{bmatrix}. $$

计算行列式：

$$ \begin{aligned} \det H_F &=(b-c)(-c(b-a))\\ &\quad-[-a(b-c)]\(b-a)\\ &=(b-c)(b-a)(a-c). \end{aligned} $$

因为：

$$ a,b,c $$

两两不同，所以：

$$ \det H_F\neq0. $$

因此它确实是可逆射影变换。

## 22.3 射影变换的唯一性

先证明一个引理：固定 $0,1,\infty$ 的射影变换只能是恒等变换。

### 引理：固定 $0,1,\infty$ 的射影变换是恒等变换

设射影变换 $T$ 由可逆矩阵表示：

$$
T([X:Y])=[\alpha X+\beta Y:\gamma X+\delta Y].
$$

由于矩阵可逆，它的行列式不为零：

$$
\alpha\delta-\beta\gamma\ne 0.
$$

在仿射坐标 $x=X/Y$ 下，这个变换写成

$$
T(x)=\frac{\alpha x+\beta}{\gamma x+\delta}.
$$

现在假设 $T$ 固定 $0,1,\infty$，也就是

$$
T(0)=0,\qquad T(1)=1,\qquad T(\infty)=\infty.
$$

首先，$0=[0:1]$。因此

$$
T([0:1])=[\beta:\delta]=[0:1],
$$

所以

$$
\beta=0.
$$

其次，$\infty=[1:0]$。因此

$$
T([1:0])=[\alpha:\gamma]=[1:0],
$$

所以

$$
\gamma=0.
$$

于是矩阵变成

$$
\begin{bmatrix}
\alpha&0\\
0&\delta
\end{bmatrix}.
$$

最后，$1=[1:1]$。因此

$$
T([1:1])=[\alpha:\delta]=[1:1],
$$

所以

$$
\alpha=\delta.
$$

因此，表示 $T$ 的矩阵是

$$
\begin{bmatrix}
\alpha&0\\
0&\alpha
\end{bmatrix}
=\alpha
\begin{bmatrix}
1&0\\
0&1
\end{bmatrix}.
$$

射影变换的矩阵乘以非零常数不改变它表示的变换，所以这个矩阵表示的就是恒等变换。引理得证。

---

### 定理：三个有序不同点至多确定一个射影变换

设 $P_1,P_2,P_3$ 是三个互不相同的点，$Q_1,Q_2,Q_3$ 也是三个互不相同的点。

假设有两个射影变换 $F$ 和 $G$，都满足

$$
F(P_i)=Q_i,\qquad G(P_i)=Q_i
\quad (i=1,2,3).
$$

我们要证明 $F=G$。

#### 第一步：构造一个把 $P_1,P_2,P_3$ 送到 $0,1,\infty$ 的射影变换

用齐次坐标表示这三个点：

$$
P_i=[u_i:v_i]\qquad(i=1,2,3).
$$

定义线性函数

$$
\ell_i(X,Y)=v_iX-u_iY.
$$

它在点 $P_i$ 处等于零，因为

$$
\ell_i(u_i,v_i)=v_i u_i-u_i v_i=0.
$$

又因为 $P_1,P_2,P_3$ 互不相同，所以

$$
\ell_1(u_2,v_2)\ne 0,\qquad
\ell_3(u_2,v_2)\ne 0.
$$

因此可以定义非零常数

$$
c=\frac{\ell_3(u_2,v_2)}{\ell_1(u_2,v_2)}.
$$

定义射影变换 $A$：

$$
A([X:Y])
=

[c\,\ell_1(X,Y):\ell_3(X,Y)].
$$

由于 $P_1\ne P_3$，$\ell_1$ 和 $\ell_3$ 是两个不成比例的线性函数。因此这个变换由可逆矩阵表示，确实是射影变换。

逐点计算：

$$
A(P_1)=[0:1]=0,
$$

因为 $\ell_1(P_1)=0$ 且 $\ell_3(P_1)\ne0$。

$$
A(P_3)=[1:0]=\infty,
$$

因为 $\ell_3(P_3)=0$ 且 $\ell_1(P_3)\ne0$。

而根据 $c$ 的定义，

$$
A(P_2)
=

[c\,\ell_1(u_2,v_2):\ell_3(u_2,v_2)]
=

[1:1]
=

1.

$$

所以

$$
A(P_1)=0,\qquad A(P_2)=1,\qquad A(P_3)=\infty.
$$

#### 第二步：构造一个固定 $P_1,P_2,P_3$ 的变换

定义

$$
H=G^{-1}\circ F.
$$

复合变换从右向左进行。对每个 $i=1,2,3$，有

$$
P_i
\xrightarrow{F}
Q_i
\xrightarrow{G^{-1}}
P_i,
$$

因为 $G(P_i)=Q_i$。因此

$$
H(P_i)=P_i
\quad(i=1,2,3).
$$

也就是说，$H$ 分别固定 $P_1,P_2,P_3$。

#### 第三步：把 $H$ 的固定点换成 $0,1,\infty$

定义

$$
K=A\circ H\circ A^{-1}.
$$

因为 $A(P_1)=0$，所以 $A^{-1}(0)=P_1$。于是

$$
K(0)
=A\bigl(H(A^{-1}(0))\bigr)
=A\bigl(H(P_1)\bigr)
=A(P_1)
=0.
$$

同理，

$$
K(1)=1,\qquad K(\infty)=\infty.
$$

所以 $K$ 固定 $0,1,\infty$。根据前面的引理，$K$ 是恒等变换：

$$
K=\operatorname{id}.
$$

#### 第四步：推出 $F=G$

由

$$
K=A\circ H\circ A^{-1}
$$

可得

$$
H=A^{-1}\circ K\circ A.
$$

代入 $K=\operatorname{id}$，得到

$$
H
=A^{-1}\circ\operatorname{id}\circ A
=\operatorname{id}.
$$

而 $H=G^{-1}\circ F$，因此

$$
G^{-1}\circ F=\operatorname{id}.
$$

在等式两边左侧复合 $G$：

$$
G\circ(G^{-1}\circ F)
=

G\circ\operatorname{id}.
$$

利用复合的结合律以及 $G\circ G^{-1}=\operatorname{id}$，得到

$$
F=G.
$$

因此，满足

$$
P_1\mapsto Q_1,\qquad
P_2\mapsto Q_2,\qquad
P_3\mapsto Q_3
$$

的射影变换至多只有一个。这就证明了唯一性。

# 23. 现在就能理解为什么第四个点携带真正的射影信息

假设有三个不同的点：

$$ A,B,C. $$

我们总能通过射影变换把它们送到：

$$ 0,1,\infty. $$

因此，单独考虑三个不同的射影点时，它们之间没有额外的数值射影不变量。

因为任何三个不同的点，都可以变成任何另外三个不同的点。

但是如果我们再加入第四个点：

$$ D, $$

情况就变了。

前三个点已经确定了变换。

第四个点最终映射到哪里，不能再任意决定。

它的位置由原来的四点交比控制。

所以：

$$ \boxed{ 三个点可以用来固定一维射影坐标系， 第四个点才开始产生非平凡的数值不变量 } $$

事实上，对于 $\mathbb P^1$ 上四个不同的有序点组：

$$ (A,B,C,D) $$

和：

$$ (A',B',C',D'), $$

存在一个射影变换将它们逐一对应，当且仅当：

$$ \boxed{ \operatorname{CR}(A,B;C,D) = \operatorname{CR}(A',B';C',D') } $$

所以交比不只是某个偶然保持不变的数字。

它能够完全判定一维射影空间中的两个有序四点组是否射影等价。

这是非常强的结论。

# 24. 交比在透视投影中有什么用途？

现在我们把它和计算机图形学、计算机视觉联系起来。

考虑三维空间中的一条直线，上面有四个不同的点：

$$ A,\quad B,\quad C,\quad D. $$

如果使用理想针孔相机把它们投影到图像平面，只要这条三维直线不经过相机中心，其投影仍然是一条图像直线。

记投影结果为：

$$ A',\quad B',\quad C',\quad D'. $$

这条三维直线到图像直线之间的映射，是两条射影直线之间的一个射影映射。

因此：

$$ \boxed{ \operatorname{CR}(A,B;C,D) = \operatorname{CR}(A',B';C',D') } $$

即使透视投影改变了点之间的普通距离比例，交比仍然保持不变。

[Railroad Tracks](https://images.openai.com/static-rsc-4/6e-l2OJZ_mpAl9Rcrgxm41hobsnEocW4eCN6rlg1bq_yX4EMPfndgK_PBX8AXII89LVANJSFS8kWCmlw1oGvIKUuKGeuVB-wyHhx0J7tEZuIosyUi7fTaKYIh2NBmrnISGY4miqlnSlGrLVFoeXz2pr8DrIslGZZu7Vk53eocTxNoTDd0oao8b_CJkFWH3vl?purpose=inline)

透视场景中，沿同一直线方向排列的物体，其图像间距可能越来越小；普通长度比例发生变化，但四个共线点的交比仍然具有射影不变性。

这里可以注意一个非常重要的区别：

交比并不意味着我们可以直接从一张透视图像恢复所有真实长度。

但如果有足够的已知点、相机或场景约束，交比可以作为非常有效的几何约束。

例如透视测量、平面标定、消失点辅助测量和单视图重建中，都可能使用交比。

# 25. 最后把这一章的三个层次统一起来

我们现在实际上得到了三种越来越抽象的交比理解。

## 第一层：普通仿射坐标

四个有限共线点：

$$ X_1,X_2,X_3,X_4. $$

交比是：

$$ \boxed{ R= \frac{ (X_1-X_3)(X_2-X_4) }{ (X_1-X_4)(X_2-X_3) } } $$

在这一层，交比是两个有向比例的比值。

## 第二层：齐次坐标

在：

$$ \mathbb P^1 $$

中写：

$$ P_i=[x_i:w_i]. $$

定义：

$$ \Delta\_{ij}=x_iw_j-x_jw_i. $$

交比是：

$$ \boxed{ R= \frac{\Delta\_{13}\Delta\_{24}} {\Delta\_{14}\Delta\_{23}} } $$

在这一层，交比是四个齐次向量构成的行列式比值。

我们不再需要区分有限点和无穷远点。

## 第三层：任意射影直线

在：

$$ \mathbb P^n $$

中，任意射影直线都对应底层向量空间中的一个二维线性子空间。

选择它的一组基：

$$ \mathbf u,\mathbf v. $$

每个点写成：

$$ P_i=[s_i\mathbf u+t_i\mathbf v]. $$

然后：

$$ \Delta\_{ij}=s_it_j-s_jt_i. $$

仍然有：

$$ \boxed{ R= \frac{\Delta\_{13}\Delta\_{24}} {\Delta\_{14}\Delta\_{23}} } $$

而且结果既不依赖于代表向量，也不依赖于基的选择。

这才是完整的射影几何观点。

# 26. 为什么交比恰好与齐次坐标如此契合？

这里我想再强调一次你之前一直研究的那个统一思想：

$$ \boxed{ \text{射影几何研究的是整体缩放被识别后的几何关系} } $$

在射影空间中：

$$ \mathbf p\sim\lambda\mathbf p. $$

在射影变换中：

$$ H\sim\lambda H. $$

而交比中的行列式满足：

$$ \det[\lambda_i\mathbf p_i,\lambda_j\mathbf p_j] = \lambda_i\lambda_j \det[\mathbf p_i,\mathbf p_j]. $$

同时：

$$ \det[H\mathbf p_i,H\mathbf p_j] = (\det H)\det[\mathbf p_i,\mathbf p_j]. $$

然后交比利用一种特殊的分子分母组合，让所有额外缩放因子相互抵消。

所以：

$$ \boxed{ \text{交比的本质，是构造一种不依赖于整体尺度、又能抵抗射影变换的比例关系} } $$

这也解释了为什么它是射影几何中的自然数值量。

# 27. 本章最值得记住的结论

| 几何体系 | 一些典型的不变量             |
| -------- | ---------------------------- |
| 欧氏几何 | 距离、角度、共线性           |
| 相似几何 | 角度、长度比例、共线性       |
| 仿射几何 | 平行性、共线性、有向线段比例 |
| 射影几何 | 关联关系、共线性、交比       |

注意这里列的是代表性不变量，不是完整分类。

这一章的最核心公式是：

$$ \boxed{ \operatorname{CR}(A,B;C,D) = \frac{ (X_A-X_C)(X_B-X_D) }{ (X_A-X_D)(X_B-X_C) } } $$

以及它的齐次形式：

$$ \boxed{ \operatorname{CR}(P_1,P_2;P_3,P_4) = \frac{ \Delta\_{13}\Delta\_{24} }{ \Delta\_{14}\Delta\_{23} } } $$

其中：

$$ \Delta\_{ij} = \det[\mathbf p_i\ \mathbf p_j]. $$

最重要的定理：

$$ \boxed{ \operatorname{CR}(T(A),T(B);T(C),T(D)) = \operatorname{CR}(A,B;C,D) } $$

这里 $T$ 是射影变换，并且四个点共线、互不相同。

而整个章节在思想上最重要的结论是：

$$ \boxed{ \text{三个不同点确定一维射影坐标系， 第四个点的交比提供非平凡的射影不变量} } $$

# 下一章：透视投影、消失点与相机矩阵

现在，我们已经从：

$$ \mathbb P^n $$

的定义，走到了射影变换和射影不变量。

下一章非常适合正式进入：

Perspective Projection（透视投影）。

我们将从一个最简单的针孔相机开始，逐步推导：

$$ \boxed{ x=f\frac{X}{Z}, \qquad y=f\frac{Y}{Z} } $$

然后解释：

$$ \boxed{ \mathbf x\sim P\mathbf X } $$

其中：

$$ P\in\mathbb R^{3\times4}. $$

重点解决几个问题：

- 为什么三维点投影到二维以后会出现 $1/Z$？
- 相机矩阵为什么是 $3\times4$，而二维 homography 是 $3\times3$？
- 透视投影与一般射影自同构有什么区别？
- 为什么三维平行线会出现消失点（vanishing point）？
- 为什么同一平面在两张相机图像之间可以由 homography 关联？
- 为什么 perspective-correct interpolation 又一次使用了同一种齐次除法结构？

这会把你之前研究的齐次坐标、射影变换、分式线性关系、三维图形渲染和透视正确插值逐步统一起来。
