# 第七章：射影对偶性（Projective Duality）与对偶空间

这一章非常重要，而且会比前面几章更深入线性代数的本质。

在第二章中，我们已经学过两个极其对称的公式：

两个射影点确定一条射影直线：

$$ \boxed{ \mathbf l=\mathbf p_1\times\mathbf p_2 } $$

两条射影直线确定一个射影点：

$$ \boxed{ \mathbf p=\mathbf l_1\times\mathbf l_2 } $$

当时我们说，这种对称性不是巧合，而是射影几何中的：

$$ \boxed{ \text{Projective Duality} } $$

即射影对偶性。

但我们一直没有真正解释：

> 为什么点和直线可以互换？它们明明是不同的几何对象，为什么在射影几何里表现得如此对称？

要回答这个问题，我们必须引入一个新的概念：

$$ \boxed{ \text{Dual Space（对偶空间）} } $$

然后你会发现：

- 射影点来自向量空间 $V$。
- 射影超平面来自对偶空间 $V^*$。
- 点和超平面的关联关系，本质上是一个线性泛函的求值。
- 射影对偶性来自线性子空间与其零化子的对应关系。
- 点使用 $H$ 变换，而超平面使用 $H^{-T}$ 变换，是对偶空间的必然结果。

我们最后还会引入一种非常漂亮的几何对象：

$$ \boxed{ \text{Polar / Pole（极线与极点）} } $$

把射影对偶性和你已经学过的圆锥曲线联系起来。

# 0. 本章的符号约定

我们先统一所有基本符号。

设：

$$ V=\mathbb R^{n+1}. $$

其中：

- $V$：一个 $n+1$ 维实向量空间。
- $\mathbf v\in V$：一个向量。
- $\mathbf0$：零向量。
- $V^*$：$V$ 的对偶空间。
- $\varphi\in V^*$：一个线性泛函。
- $\mathbb P(V)$：由 $V$ 中一维线性子空间组成的射影空间。
- $[\mathbf v]$：非零向量 $\mathbf v$ 对应的射影点。

仍然使用等价关系：

$$ \mathbf v\sim\lambda\mathbf v, \qquad \lambda\in\mathbb R\setminus\{0\}. $$

因此：

$$ \mathbb P(V) = (V\setminus\{\mathbf0\})/\sim. $$

并且：

$$ \dim\mathbb P(V)=n. $$

本章大部分具体计算都在：

$$ V=\mathbb R^3 $$

和：

$$ \mathbb P(V)=\mathbb P^2 $$

中进行。

最后再推广到一般的：

$$ \mathbb P^n. $$

# 1. 先回顾一个简单的问题：直线到底是什么？

考虑普通二维仿射平面中的直线：

$$ X+2Y-3=0. $$

齐次化以后：

$$ x+2y-3w=0. $$

我们之前用三个系数表示这条射影直线：

$$ \mathbf l= \begin{bmatrix} 1\\2\\-3 \end{bmatrix}. $$

而一个射影点写成：

$$ \mathbf p= \begin{bmatrix} x\\y\\w \end{bmatrix}. $$

点在线上，当且仅当：

$$ \boxed{ \mathbf l^{\mathsf T}\mathbf p=0 } $$

因为：

$$ \mathbf l^{\mathsf T}\mathbf p = x+2y-3w. $$

这个公式现在应该已经很熟悉了。

但是这里隐藏着一个重要问题：

$\mathbf l$ 和 $\mathbf p$ 虽然都是三个数，它们真的属于同一种数学空间吗？

从坐标表示来看：

$$ \mathbf p= \begin{bmatrix} x\\y\\w \end{bmatrix}, $$

$$ \mathbf l= \begin{bmatrix} a\\b\\c \end{bmatrix}. $$

它们看起来完全一样。

但从数学对象来看，它们其实有不同的角色。

我们需要把这个区别讲清楚。

# 2. 什么是线性泛函（Linear Functional）？

先暂时忘记射影几何。

考虑：

$$ V=\mathbb R^3. $$

我们已经知道，一个普通向量可以写成：

$$ \mathbf v= \begin{bmatrix} x\\y\\z \end{bmatrix}. $$

现在我们考虑一种函数：

$$ \varphi:V\to\mathbb R. $$

也就是说：

$$ \varphi $$

接收一个三维向量，然后输出一个实数。

例如：

$$ \boxed{ \varphi(x,y,z)=2x+3y-z } $$

输入：

$$ \mathbf v= \begin{bmatrix} 1\\2\\3 \end{bmatrix}. $$

那么：

$$ \varphi(\mathbf v) = 2\cdot1+3\cdot2-3. $$

所以：

$$ \varphi(\mathbf v)=5. $$

这个函数就把三维向量：

$$ (1,2,3) $$

映射到了实数：

$$ 5. $$

但这还不足以称为线性泛函。

我们需要验证它具有线性性。

# 3. 线性泛函的严格定义

设：

$$ V $$

是实向量空间。

一个函数：

$$ \varphi:V\to\mathbb R $$

如果满足以下两个条件，就称为线性泛函。

对于任意：

$$ \mathbf u,\mathbf v\in V, $$

满足加法性：

$$ \boxed{ \varphi(\mathbf u+\mathbf v) = \varphi(\mathbf u)+\varphi(\mathbf v) } $$

对于任意：

$$ \lambda\in\mathbb R, $$

满足齐次性：

$$ \boxed{ \varphi(\lambda\mathbf v) = \lambda\varphi(\mathbf v) } $$

这两个条件也可以合并成：

$$ \boxed{ \varphi(\alpha\mathbf u+\beta\mathbf v) = \alpha\varphi(\mathbf u) + \beta\varphi(\mathbf v) } $$

其中：

$$ \alpha,\beta\in\mathbb R. $$

注意：

线性泛函的输出是标量，而不一定是向量。

这和我们之前学习的普通线性变换略有不同。

例如：

$$ A:\mathbb R^3\to\mathbb R^3 $$

是向量到向量的线性映射。

而：

$$ \varphi:\mathbb R^3\to\mathbb R $$

是向量到标量的线性映射。

它们都是线性映射，但后者有一个专门的名字：

$$ \boxed{ \text{Linear Functional} } $$

# 4. 用矩阵表示线性泛函

现在回到：

$$ \varphi(x,y,z)=2x+3y-z. $$

我们可以写成：

$$ \varphi(\mathbf v) = \begin{bmatrix} 2&3&-1 \end{bmatrix} \begin{bmatrix} x\\y\\z \end{bmatrix}. $$

也就是：

$$ \boxed{ \varphi(\mathbf v)=\mathbf a^{\mathsf T}\mathbf v } $$

其中：

$$ \mathbf a= \begin{bmatrix} 2\\3\\-1 \end{bmatrix}. $$

但这里需要特别强调一个严格的数学区别。

$$ \varphi $$

本身是一个函数。

而：

$$ \mathbf a $$

只是我们选择坐标以后，用来表示这个函数的一组系数。

更自然的记号是：

$$ \varphi= \begin{bmatrix} 2&3&-1 \end{bmatrix}. $$

把它看成一个行向量。

那么：

$$ \varphi(\mathbf v) = \varphi\mathbf v. $$

这里：

$$ \varphi $$

属于对偶空间，而：

$$ \mathbf v $$

属于原来的向量空间。

你可以先建立这样一种直觉：

$$ \boxed{ \text{普通向量描述一个向量对象} } $$

而：

$$ \boxed{ \text{对偶向量描述一种线性测量规则} } $$

例如：

$$ \varphi(x,y,z)=2x+3y-z $$

就是一条对输入向量进行线性测量的规则。

# 5. 什么是对偶空间 $V^*$？

现在正式定义。

给定一个向量空间：

$$ V. $$

我们把所有从 $V$ 到实数域的线性泛函组成一个集合：

$$ \boxed{ V^* = \{ \varphi:V\to\mathbb R \mid \varphi\text{ 是线性的} \} } $$

这个集合叫：

$$ \boxed{ V\text{ 的对偶空间} } $$

英文：

$$ \text{Dual Space}. $$

为什么它也是向量空间？

因为两个线性泛函可以相加。

假设：

$$ \varphi,\psi\in V^*. $$

定义：

$$ (\varphi+\psi)(\mathbf v) = \varphi(\mathbf v)+\psi(\mathbf v). $$

另外可以进行数乘：

$$ (\lambda\varphi)(\mathbf v) = \lambda\varphi(\mathbf v). $$

而且这些运算仍然保持线性性。

所以：

$$ V^* $$

本身也是一个向量空间。

# 6. $V^*$ 的维数是多少？

这是一个很重要的事实。

如果：

$$ \dim V=n+1, $$

那么：

$$ \boxed{ \dim V^*=n+1 } $$

我们不直接接受这个结论，而是从一组基开始推导。

假设 $V$ 有一组基：

$$ \mathbf e_0,\mathbf e_1,\ldots,\mathbf e_n. $$

那么任意向量：

$$ \mathbf v\in V $$

都可以唯一写成：

$$ \mathbf v = x_0\mathbf e_0 + x_1\mathbf e_1 +\cdots+ x_n\mathbf e_n. $$

现在考虑任意线性泛函：

$$ \varphi\in V^*. $$

由于线性性：

$$ \varphi(\mathbf v) = x_0\varphi(\mathbf e_0) + x_1\varphi(\mathbf e_1) +\cdots+ x_n\varphi(\mathbf e_n). $$

定义：

$$ a_i=\varphi(\mathbf e_i), \qquad i=0,\ldots,n. $$

于是：

$$ \boxed{ \varphi(\mathbf v) = a_0x_0+a_1x_1+\cdots+a_nx_n } $$

所以一个线性泛函完全由：

$$ a_0,a_1,\ldots,a_n $$

这 $n+1$ 个实数决定。

反过来，任意选择 $n+1$ 个实数：

$$ a_0,\ldots,a_n $$

也都能定义一个线性泛函：

$$ \varphi(\mathbf v)=\sum\_{i=0}^n a_ix_i. $$

因此：

$$ \boxed{ \dim V^*=\dim V } $$

特别地：

$$ (\mathbb R^3)^* $$

也是三维向量空间。

但这里有一个很重要的细节：

$$ \boxed{ V\text{ 和 }V^*\text{ 维数相同，不意味着它们是同一种对象} } $$

它们可以建立线性同构，但一般没有一个不依赖额外选择的自然同一关系。

这一点后面解释射影对偶性时非常重要。

# 7. 什么是对偶基（Dual Basis）？

这一节会让 $V^*$ 的结构更加清楚。

设：

$$ \mathbf e_0,\mathbf e_1,\ldots,\mathbf e_n $$

是 $V$ 的一组基。

我们可以在 $V^*$ 中定义一组特殊的线性泛函：

$$ \mathbf e^0,\mathbf e^1,\ldots,\mathbf e^n. $$

要求：

$$ \boxed{ \mathbf e^i(\mathbf e_j)=\delta^i_j } $$

其中：

$$ \delta^i_j = \begin{cases} 1,&i=j,\\ 0,&i\neq j. \end{cases} $$

这叫 Kronecker delta。

我们具体看：

$$ V=\mathbb R^3. $$

取标准基：

$$ \mathbf e_0= \begin{bmatrix} 1\\0\\0 \end{bmatrix}, $$

$$ \mathbf e_1= \begin{bmatrix} 0\\1\\0 \end{bmatrix}, $$

$$ \mathbf e_2= \begin{bmatrix} 0\\0\\1 \end{bmatrix}. $$

对应的对偶基可以定义为：

$$ \mathbf e^0(x,y,z)=x, $$

$$ \mathbf e^1(x,y,z)=y, $$

$$ \mathbf e^2(x,y,z)=z. $$

因此：

$$ \mathbf e^0(\mathbf e_0)=1, $$

但：

$$ \mathbf e^0(\mathbf e_1)=0, $$

$$ \mathbf e^0(\mathbf e_2)=0. $$

其他两个也完全类似。

任意线性泛函：

$$ \varphi(x,y,z)=ax+by+cz $$

都可以写成：

$$ \boxed{ \varphi = a\mathbf e^0+b\mathbf e^1+c\mathbf e^2 } $$

因此，对偶基就像普通向量基一样，可以表示所有对偶向量。

但它的元素是函数，不是原空间中的位置向量。

# 8. 现在终于可以重新理解射影直线了

回到：

$$ \mathbb P^2=\mathbb P(\mathbb R^3). $$

一个射影点：

$$ P=[x:y:w] $$

对应：

$$ V=\mathbb R^3 $$

中的一个一维线性子空间。

而一条射影直线：

$$ \ell: ax+by+cw=0 $$

可以由一个线性泛函定义：

$$ \varphi(x,y,w)=ax+by+cw. $$

其中：

$$ \varphi\neq0. $$

也就是说：

$$ \varphi\in V^*\setminus\{0\}. $$

那么这条射影直线就是：

$$ \boxed{ \ell = \{ [\mathbf v]\in\mathbb P(V) : \varphi(\mathbf v)=0 \} } $$

现在考虑：

$$ \lambda\varphi, \qquad\lambda\neq0. $$

它定义的方程：

$$ (\lambda\varphi)(\mathbf v)=0 $$

等价于：

$$ \lambda\varphi(\mathbf v)=0. $$

因为：

$$ \lambda\neq0, $$

所以等价于：

$$ \varphi(\mathbf v)=0. $$

因此：

$$ \varphi $$

和：

$$ \lambda\varphi $$

定义同一条射影直线。

所以一条射影直线真正对应的是：

$$ \boxed{ [\varphi]\in\mathbb P(V^*) } $$

而不是单个函数 $\varphi$。

这就是核心发现。

# 9. 射影点属于 $\mathbb P(V)$，射影直线属于 $\mathbb P(V^*)$

现在我们可以把两类对象严格区分开来。

对于：

$$ V=\mathbb R^3, $$

有：

$$ \boxed{ \text{射影点} \longleftrightarrow \mathbb P(V)\text{ 中的元素} } $$

而：

$$ \boxed{ \text{射影直线} \longleftrightarrow \mathbb P(V^*)\text{ 中的元素} } $$

请注意，第二句话的精确含义是：

> $\mathbb P(V^*)$ 中的一个点，可以用来表示原射影平面 $\mathbb P(V)$ 中的一条直线。

我们把：

$$ \mathbb P(V^*) $$

称为：

$$ \boxed{ \text{Dual Projective Plane} } $$

即对偶射影平面。

因此：

$$ \mathbb P(V) $$

和：

$$ \mathbb P(V^*) $$

分别是：

- 原射影平面（primal projective plane）；
- 对偶射影平面（dual projective plane）。

在原射影平面中，一条直线是一个一维射影子空间。

但是在对偶射影平面中，它可以被看成一个点。

这就是点线对偶最直接的来源。

# 10. 画出原空间和对偶空间之间的关系

我们可以用下面的结构理解：

原射影平面 $\mathbb P(V)$

一个点 $P$ 位于一条直线 $\ell$ 上

对偶射影平面 $\mathbb P(V^*)$

原来的直线成为对偶点；原来的点对应一条对偶直线

概念示意：左右两侧不是同一个射影平面。这里用不同颜色表示原对象及其对偶角色。

左边：

$$ P\in\ell. $$

右边：

$$ \ell^*\in P^*. $$

也就是说：

$$ \boxed{ \text{原空间中的“点在线上”} \longleftrightarrow \text{对偶空间中的“对偶点在对偶线上”} } $$

<!-- prettier-ignore -->
我们下面会严格定义 $P^*$ 和 $\ell^*$，并证明这一点。

# 11. 什么是 Kernel（核）？

先回到线性泛函：

$$ \varphi:V\to\mathbb R. $$

定义：

$$ \boxed{ \ker\varphi = \{ \mathbf v\in V: \varphi(\mathbf v)=0 \} } $$

它叫：

$$ \boxed{ \text{Kernel（核）} } $$

这里就是一个线性方程的所有解组成的集合。

例如：

$$ \varphi(x,y,z)=x+y-z. $$

那么：

$$ \ker\varphi = \{ (x,y,z): x+y-z=0 \}. $$

它是：

$$ \mathbb R^3 $$

中的一个二维线性子空间。

为什么？

因为 $\varphi$ 是非零线性泛函，输出空间是：

$$ \mathbb R. $$

所以：

$$ \operatorname{rank}\varphi=1. $$

根据秩-零化度定理：

$$ \dim\ker\varphi = \dim V-\operatorname{rank}\varphi. $$

因此：

$$ \dim\ker\varphi = 3-1=2. $$

所以：

$$ \ker\varphi $$

是二维平面。

将它射影化：

$$ \mathbb P(\ker\varphi) $$

就是：

$$ \mathbb P^2 $$

中的一条射影直线。

因此：

$$ \boxed{ \ell=\mathbb P(\ker\varphi) } $$

这是对射影直线的一个非常本质的定义。

# 12. 每个非零线性泛函对应一条射影超平面

现在推广到一般情况。

设：

$$ V=\mathbb R^{n+1}. $$

取非零线性泛函：

$$ \varphi\in V^*. $$

则：

$$ \ker\varphi $$

是：

$$ V $$

中的 $n$ 维线性子空间。

因为：

$$ \dim V=n+1, $$

以及：

$$ \operatorname{rank}\varphi=1. $$

所以：

$$ \dim\ker\varphi=n. $$

射影化以后：

$$ \dim\mathbb P(\ker\varphi)=n-1. $$

因此：

$$ \boxed{ \mathbb P(\ker\varphi) \text{ 是 }\mathbb P^n\text{ 中的射影超平面} } $$

这解释了一个很重要的统一关系：

$$ \boxed{ \mathbb P(V^*)\text{ 中的点} \longleftrightarrow \mathbb P(V)\text{ 中的超平面} } $$

注意，是超平面，不总是直线。

例如：

| 原射影空间    | 对偶点表示的原空间对象 |
| ------------- | ---------------------- |
| $\mathbb P^1$ | 射影点                 |
| $\mathbb P^2$ | 射影直线               |
| $\mathbb P^3$ | 射影平面               |
| $\mathbb P^4$ | 三维射影超平面         |
| $\mathbb P^n$ | $n-1$ 维射影超平面     |

这也解释了为什么点线对偶在：

$$ \mathbb P^2 $$

中特别漂亮。

因为二维射影空间中的超平面，恰好就是直线。

# 13. 一个原射影点如何对应对偶空间中的一条直线？

前面我们已经证明：

$$ \mathbb P(V^*)\text{ 中的一个点} $$

可以表示：

$$ \mathbb P(V)\text{ 中的一个超平面}. $$

那么反过来呢？

能不能让：

$$ \mathbb P(V)\text{ 中的一个点} $$

对应：

$$ \mathbb P(V^*)\text{ 中的一个超平面}? $$

答案是可以。

而且定义非常自然。

设原射影点为：

$$ P=[\mathbf p], \qquad \mathbf p\in V\setminus\{\mathbf0\}. $$

我们考虑所有满足：

$$ \varphi(\mathbf p)=0 $$

的线性泛函。

定义：

$$ \boxed{ P^* = \{ [\varphi]\in\mathbb P(V^*): \varphi(\mathbf p)=0 \} } $$

这里：

$$ P^* $$

叫作 $P$ 对应的对偶超平面。

如果：

$$ V=\mathbb R^3, $$

那么：

$$ P^* $$

就是对偶射影平面中的一条射影直线。

我们来理解为什么。

# 14. 一个具体例子：原空间中的点变成对偶空间中的直线

考虑：

$$ \mathbb P^2. $$

取原射影点：

$$ P=[1:2:1]. $$

对应向量：

$$ \mathbf p= \begin{bmatrix} 1\\2\\1 \end{bmatrix}. $$

现在考虑任意线性泛函：

$$ \varphi(x,y,w)=ax+by+cw. $$

它由三个系数表示：

$$ [a:b:c]\in\mathbb P(V^*). $$

要求：

$$ \varphi(\mathbf p)=0. $$

代入：

$$ a\cdot1+b\cdot2+c\cdot1=0. $$

所以：

$$ \boxed{ a+2b+c=0 } $$

注意这个方程的变量已经不是：

$$ x,y,w. $$

而是：

$$ a,b,c. $$

因此它在对偶射影平面：

$$ \mathbb P(V^*) $$

中定义一条直线。

所以：

$$ \boxed{ P=[1:2:1] \longleftrightarrow P^*:\ a+2b+c=0 } $$

这正是我们想要的点线对偶。

## 但这个方程的几何含义是什么？

回忆：

$$ ax+by+cw=0 $$

表示原射影平面中的一条直线。

现在要求它通过：

$$ P=[1:2:1]. $$

那么自然需要：

$$ a+2b+c=0. $$

所以：

$$ \boxed{ P^* \text{ 中的所有对偶点，恰好对应原空间中所有经过 }P\text{ 的直线} } $$

这句话非常重要。

原射影平面中经过一个固定点的所有直线，在对偶射影平面中组成一条直线。

我们把这种所有直线都经过同一个点的集合称为一束直线（pencil of lines）。

现在看到，对偶空间把一束直线变成了一条普通的射影直线。

# 15. 再看反过来的例子

考虑原射影直线：

$$ \ell: x+2y-3w=0. $$

它对应线性泛函：

$$ \varphi(x,y,w)=x+2y-3w. $$

所以在对偶射影平面中，它对应点：

$$ \boxed{ \ell^*=[1:2:-3] } $$

注意这里的坐标：

$$ [1:2:-3] $$

是对偶坐标，不是原射影平面中的点坐标。

现在取原空间中的一个点：

$$ P=[1:1:1]. $$

检验：

$$ 1+2-3=0. $$

所以：

$$ P\in\ell. $$

那么 $P$ 对应的对偶直线为：

$$ P^*: a+b+c=0. $$

检查对偶点：

$$ \ell^*=[1:2:-3]. $$

代入：

$$ 1+2-3=0. $$

所以：

$$ \ell^*\in P^*. $$

于是：

$$ \boxed{ P\in\ell \iff \ell^*\in P^* } $$

这就是射影对偶性最基本的关联关系。

原来的：

> 点 $P$ 位于直线 $\ell$ 上。

在对偶空间中变成：

<!-- prettier-ignore -->
> 对偶点 $\ell^*$ 位于对偶直线 $P^*$ 上。

点和直线的角色完全交换。

# 16. 关联关系其实就是线性泛函求值为零

现在我们可以更本质地看待：

$$ \mathbf l^{\mathsf T}\mathbf p=0. $$

之前我们把它理解成：

> 两个三维向量正交。

在标准欧氏坐标中，这样理解可以帮助计算。

但严格来说，更本质的含义是：

$$ \boxed{ \varphi(\mathbf p)=0 } $$

其中：

$$ \mathbf p\in V, \qquad \varphi\in V^*. $$

这叫：

$$ \boxed{ \text{Natural Pairing（自然配对）} } $$

通常记作：

$$ \langle\varphi,\mathbf p\rangle = \varphi(\mathbf p). $$

它是一个双线性映射：

$$ \boxed{ V^*\times V\to\mathbb R } $$

也就是说，输入一个对偶向量和一个普通向量，输出一个实数。

因此点与超平面的关联关系可以写为：

$$ \boxed{ \langle\varphi,\mathbf p\rangle=0 } $$

这种表达比：

$$ \mathbf l^{\mathsf T}\mathbf p=0 $$

更抽象，但也更准确。

因为：

$$ \mathbf l^{\mathsf T}\mathbf p $$

只是我们选择基和对偶基以后，自然配对的矩阵表示。

# 17. 为什么这里不应该简单地把它当作普通欧氏内积？

这是一个值得深入理解的区别。

在普通欧氏空间：

$$ \mathbb R^3 $$

中，我们有内积：

$$ \mathbf u^{\mathsf T}\mathbf v. $$

它接收两个向量：

$$ \mathbf u,\mathbf v\in V. $$

而对偶配对：

$$ \varphi(\mathbf v) $$

接收的是：

$$ \varphi\in V^*, $$

以及：

$$ \mathbf v\in V. $$

两者的输入类型不同。

虽然选择标准欧氏内积以后，可以把向量 $\mathbf a$ 与线性泛函：

$$ \varphi\_{\mathbf a}(\mathbf v)=\mathbf a^{\mathsf T}\mathbf v $$

对应起来，但这种对应使用了额外的内积结构。

因此：

$$ \boxed{ V\neq V^* } $$

作为数学对象，它们不是同一个空间。

虽然对于有限维实向量空间：

$$ \boxed{ V\cong V^* } $$

但这个同构一般不是无须选择即可指定的。

为什么这一点重要？

因为射影对偶性并不需要事先给空间定义欧氏长度或角度。

它只需要：

- 向量空间；
- 线性泛函；
- 核；
- 子空间包含关系。

所以它属于射影几何，而不是依赖欧氏度量的特殊理论。

# 18. 现在解释为什么点线可以相互交换

我们整理一下。

一个原射影点：

$$ P=[\mathbf p]\in\mathbb P(V) $$

对应：

$$ P^* = \{ [\varphi]: \varphi(\mathbf p)=0 \} $$

这个集合是对偶空间中的一条直线。

另一方面，一条原射影直线：

$$ \ell=\mathbb P(\ker\varphi) $$

对应对偶射影点：

$$ \ell^*=[\varphi]. $$

所以：

$$ \boxed{ \begin{array}{ccc} \mathbb P(V)& &\mathbb P(V^*)\\$$3pt] \text{点}&\longleftrightarrow&\text{直线}\\ \text{直线}&\longleftrightarrow&\text{点} \end{array} } $$

并且：

$$ \boxed{ P\in\ell \iff \ell^*\in P^* } $$

这个关系是射影对偶的真正基础。

注意它和“把点坐标直接当成直线系数”并不是同一回事。

我们是在两个不同的射影空间之间建立一个保留关联关系但反转对象类型的对应。

# 19. 为什么两个点确定一条线，和两条线确定一个点是对偶命题？

现在我们回到第二章的两个基本定理。

## 原命题

在：

$$ \mathbb P^2 $$

中，任意两个不同的点：

$$ P_1,P_2 $$

确定唯一一条射影直线：

$$ \ell. $$

即：

$$ P_1\in\ell, $$

$$ P_2\in\ell. $$

现在进入对偶空间。

原来的两个点：

$$ P_1,P_2 $$

变成两条对偶直线：

$$ P_1^*,P_2^*. $$

原来的直线：

$$ \ell $$

变成对偶点：

$$ \ell^*. $$

由于关联关系保持：

$$ P_1\in\ell \iff \ell^*\in P_1^*, $$

以及：

$$ P_2\in\ell \iff \ell^*\in P_2^*. $$

所以：

$$ \ell^* $$

同时属于：

$$ P_1^* $$

和：

$$ P_2^*. $$

因此：

$$ \boxed{ \text{两条不同射影直线确定唯一一个交点} } $$

这就是原命题的对偶命题。

两者不是两个完全无关的几何事实。

它们实际上是同一个线性代数结构，从原空间和对偶空间两个方向观察的结果。

# 20. 叉积为什么会在两个公式中重复出现？

现在我们终于可以严谨解释：

$$ \mathbf l=\mathbf p_1\times\mathbf p_2 $$

和：

$$ \mathbf p=\mathbf l_1\times\mathbf l_2 $$

为什么形式完全相同。

## 20.1 两点定直线

设：

$$ \mathbf p_1,\mathbf p_2\in\mathbb R^3 $$

线性无关。

我们要求一个非零对偶向量：

$$ \varphi= \begin{bmatrix} a&b&c \end{bmatrix} $$

满足：

$$ \varphi(\mathbf p_1)=0, $$

$$ \varphi(\mathbf p_2)=0. $$

也就是：

$$ \begin{bmatrix} \mathbf p_1^{\mathsf T}\\ \mathbf p_2^{\mathsf T} \end{bmatrix} \begin{bmatrix} a\\b\\c \end{bmatrix} = \mathbf0. $$

因为：

$$ \mathbf p_1,\mathbf p_2 $$

线性无关，所以这个矩阵的秩为：

$$ 2. $$

因此零空间维数：

$$ 3-2=1. $$

叉积：

$$ \mathbf p_1\times\mathbf p_2 $$

恰好提供这个零空间的一组非零生成向量。

因此：

$$ \boxed{ \mathbf l\sim\mathbf p_1\times\mathbf p_2 } $$

这里我们利用标准坐标，把对偶向量的系数也写成列向量。

## 20.2 两线定交点

现在给定两条不同射影直线，其系数为：

$$ \mathbf l_1,\mathbf l_2\in\mathbb R^3. $$

交点：

$$ \mathbf p $$

必须满足：

$$ \mathbf l_1^{\mathsf T}\mathbf p=0, $$

$$ \mathbf l_2^{\mathsf T}\mathbf p=0. $$

即：

$$ \begin{bmatrix} \mathbf l_1^{\mathsf T}\\ \mathbf l_2^{\mathsf T} \end{bmatrix} \mathbf p = \mathbf0. $$

又是一个秩为 $2$ 的 $2\times3$ 矩阵。

它的零空间维数同样为：

$$ 1. $$

因此：

$$ \boxed{ \mathbf p\sim\mathbf l_1\times\mathbf l_2 } $$

形式相同的根本原因是：

$$ \boxed{ \text{两个独立的线性约束，在三维空间中留下一个一维零空间} } $$

无论约束的是：

- 对偶向量的系数；
- 还是原空间中的向量；

最后都能在所选坐标中使用叉积求解。

严格说，三维叉积本身还使用了坐标基和体积形式等额外结构；它是这一对偶关系在三维坐标中的方便表达，而不是抽象射影对偶性的定义。

# 21. 一个完整的数值例子：点线对偶

我们从两个原射影点开始：

$$ P_1=[0:0:1], $$

$$ P_2=[1:1:1]. $$

对应向量：

$$ \mathbf p_1= \begin{bmatrix} 0\\0\\1 \end{bmatrix}, $$

$$ \mathbf p_2= \begin{bmatrix} 1\\1\\1 \end{bmatrix}. $$

求经过它们的射影直线：

$$ \mathbf l = \mathbf p_1\times\mathbf p_2. $$

逐项计算：

$$ a=0\cdot1-1\cdot1=-1, $$

$$ b=1\cdot1-0\cdot1=1, $$

$$ c=0\cdot1-0\cdot1=0. $$

因此：

$$ \mathbf l= \begin{bmatrix} -1\\1\\0 \end{bmatrix}. $$

即：

$$ -x+y=0. $$

所以：

$$ \boxed{ \ell:y=x } $$

现在把两个原射影点转成对偶直线。

对于：

$$ P_1=[0:0:1], $$

它的对偶直线：

$$ P_1^*: 0a+0b+1c=0. $$

所以：

$$ \boxed{ P_1^*:c=0 } $$

对于：

$$ P_2=[1:1:1], $$

它的对偶直线：

$$ \boxed{ P_2^*:a+b+c=0 } $$

我们现在求两条对偶直线的交点。

联立：

$$ c=0, $$

$$ a+b+c=0. $$

由：

$$ c=0, $$

得到：

$$ a+b=0. $$

所以：

$$ b=-a. $$

因此交点为：

$$ [a:-a:0]. $$

选择：

$$ a=1, $$

得到：

$$ \boxed{ [1:-1:0] } $$

而原来直线的系数是：

$$ [-1:1:0]. $$

注意：

$$ [1:-1:0] = [-1:1:0]. $$

因此两者确实是同一个对偶射影点。

所以：

$$ \boxed{ P_1^*\cap P_2^* = \ell^* } $$

它正好是：

$$ \boxed{ P_1,P_2\text{ 所确定的原射影直线 }\ell } $$

在对偶空间中的表示。

# 22. 三点共线与三线共点为什么也是对偶的？

前面我们已经证明：

三个射影点：

$$ P_1,P_2,P_3 $$

共线，当且仅当它们的齐次代表向量线性相关。

也就是：

$$ \boxed{ \det \begin{bmatrix} x_1&x_2&x_3\\ y_1&y_2&y_3\\ w_1&w_2&w_3 \end{bmatrix} =0 } $$

现在考虑三条射影直线：

$$ \ell_1,\ell_2,\ell_3. $$

它们共点，当且仅当存在非零向量：

$$ \mathbf p $$

同时满足：

$$ \mathbf l_i^{\mathsf T}\mathbf p=0, \qquad i=1,2,3. $$

也就是：

$$ \begin{bmatrix} \mathbf l_1^{\mathsf T}\\ \mathbf l_2^{\mathsf T}\\ \mathbf l_3^{\mathsf T} \end{bmatrix} \mathbf p = \mathbf0. $$

这个方程有非零解，当且仅当系数矩阵不可逆：

$$ \det \begin{bmatrix} \mathbf l_1^{\mathsf T}\\ \mathbf l_2^{\mathsf T}\\ \mathbf l_3^{\mathsf T} \end{bmatrix} =0. $$

使用行列式的转置性质：

$$ \det M=\det M^{\mathsf T}, $$

就得到：

$$ \boxed{ \det[\mathbf l_1\ \mathbf l_2\ \mathbf l_3]=0 } $$

因此：

\[ \boxed{ \begin{array}{c} \text{三点共线}\\[4pt] \updownarrow\\$$4pt] \text{三线共点} \end{array} } $$

这两个条件是对偶的。

一个使用三个点的线性相关性；

另一个使用三个直线系数的线性相关性。

这就是点线对偶在代数上最直观的体现之一。

# 23. 射影对偶性不只是交换点和直线的名字

这里要强调一个很重要的区别。

射影对偶性不是简单地把句子中的：

> 点

替换为：

> 直线。

而是存在一个严格的数学对应：

$$ \boxed{ \text{线性子空间} \longleftrightarrow \text{对偶空间中的线性子空间} } $$

并且这个对应会反转包含关系。

为了理解这一点，我们需要引入下一项核心概念：

$$ \boxed{ \text{Annihilator（零化子）} } $$

这个概念是整个射影对偶理论真正的线性代数基础。

# 24. 什么是零化子（Annihilator）？

设：

$$ W\subseteq V $$

是一个线性子空间。

我们定义：

$$ \boxed{ W^0 = \{ \varphi\in V^*: \varphi(\mathbf w)=0 \text{ 对所有 }\mathbf w\in W \} } $$

这里：

$$ W^0 $$

读作 $W$ 的零化子。

英文：

$$ \text{Annihilator of }W. $$

它包含所有在整个 $W$ 上取值为零的线性泛函。

这个定义看起来抽象，我们马上看例子。

# 25. 例子：$\mathbb R^3$ 中一个二维子空间的零化子

设：

$$ V=\mathbb R^3. $$

考虑二维线性子空间：

$$ W= \{ (x,y,z)\in\mathbb R^3: z=0 \}. $$

也就是：

$$ xy $$

平面。

现在考虑一般线性泛函：

$$ \varphi(x,y,z)=ax+by+cz. $$

我们要求：

$$ \varphi(\mathbf w)=0 $$

对所有：

$$ \mathbf w\in W $$

都成立。

因为 $W$ 中的向量满足：

$$ z=0, $$

所以要求：

$$ ax+by=0 $$

对任意：

$$ x,y\in\mathbb R $$

成立。

现在分别取：

$$ (x,y)=(1,0). $$

得到：

$$ a=0. $$

再取：

$$ (x,y)=(0,1). $$

得到：

$$ b=0. $$

而 $c$ 没有限制。

所以：

$$ \varphi(x,y,z)=cz. $$

因此：

$$ \boxed{ W^0 = \{ \varphi_c: \varphi_c(x,y,z)=cz, \ c\in\mathbb R \} } $$

这是对偶空间中的一维线性子空间。

所以：

$$ \dim W=2, $$

$$ \dim W^0=1. $$

两者的维数加起来：

$$ 2+1=3. $$

恰好等于：

$$ \dim V. $$

这不是巧合。

# 26. 零化子的维数公式

现在我们证明一般规律。

设：

$$ \dim V=N. $$

设：

$$ W\subseteq V $$

是一个 $k$ 维线性子空间：

$$ \dim W=k. $$

选择 $W$ 的一组基：

$$ \mathbf e_1,\ldots,\mathbf e_k. $$

然后将其扩充为 $V$ 的一组基：

$$ \mathbf e_1,\ldots,\mathbf e_k, \mathbf e\_{k+1},\ldots,\mathbf e_N. $$

任意线性泛函 $\varphi\in V^*$ 可以由它在这些基向量上的取值决定：

$$ a_i=\varphi(\mathbf e_i), \qquad i=1,\ldots,N. $$

要让：

$$ \varphi\in W^0, $$

就必须满足：

$$ \varphi(\mathbf w)=0 $$

对所有 $\mathbf w\in W$ 成立。

由于：

$$ W=\operatorname{span}(\mathbf e_1,\ldots,\mathbf e_k), $$

根据线性性，这等价于：

$$ \varphi(\mathbf e_1)=0, $$

$$ \vdots $$

$$ \varphi(\mathbf e_k)=0. $$

即：

$$ a_1=\cdots=a_k=0. $$

剩余的：

$$ a\_{k+1},\ldots,a_N $$

可以任意取值。

所以零化子有：

$$ N-k $$

个自由参数。

因此：

$$ \boxed{ \dim W^0=N-\dim W } $$

即：

$$ \boxed{ \dim W+\dim W^0=\dim V } $$

这是射影对偶性最重要的线性代数公式之一。

# 27. 零化子为什么会反转包含关系？

假设：

$$ W_1\subseteq W_2\subseteq V. $$

现在考虑：

$$ W_2^0. $$

按照定义：

$$ W_2^0 = \{ \varphi: \varphi(\mathbf w)=0 \text{ 对所有 }\mathbf w\in W_2 \}. $$

如果一个线性泛函在整个 $W_2$ 上都为零，那么它当然也会在 $W_1$ 上为零。

因为：

$$ W_1\subseteq W_2. $$

所以：

$$ \varphi\in W_2^0 \quad\Longrightarrow\quad \varphi\in W_1^0. $$

于是：

$$ \boxed{ W_1\subseteq W_2 \quad\Longrightarrow\quad W_2^0\subseteq W_1^0 } $$

注意箭头反过来了。

原来：

$$ W_1\subseteq W_2. $$

零化子以后：

$$ W_2^0\subseteq W_1^0. $$

因此：

$$ \boxed{ \text{零化子会反转子空间包含关系} } $$

这正是射影对偶中 incidence（关联关系）反转的代数本质。

# 28. 一般 $\mathbb P^n$ 中的射影对偶性

现在我们已经具备足够的线性代数知识，可以正式推广到：

$$ \mathbb P^n. $$

设：

$$ V=\mathbb R^{n+1}. $$

考虑：

$$ \mathbb P(V). $$

其中一个 $k$ 维射影子空间：

$$ L=\mathbb P(W) $$

来自一个：

$$ k+1 $$

维线性子空间 $W$。

所以：

$$ \dim W=k+1. $$

我们定义它的对偶射影子空间：

$$ \boxed{ L^*=\mathbb P(W^0) } $$

其中 $W^0\subseteq V^*$ 是 $W$ 的零化子。

我们已经证明：

$$ \dim W^0 = \dim V-\dim W. $$

代入：

$$ \dim W^0 = (n+1)-(k+1). $$

得到：

$$ \dim W^0=n-k. $$

射影化以后，维数减少 $1$：

$$ \dim\mathbb P(W^0) = (n-k)-1. $$

因此：

$$ \boxed{ \dim L^*=n-k-1 } $$

这是射影对偶性的一般维数公式。

也就是说：

$$ \boxed{ \mathbb P^n\text{ 中的 }k\text{ 维射影子空间} \longleftrightarrow \mathbb P(V^*)\text{ 中的 }(n-k-1)\text{ 维射影子空间} } $$

我们来看看它意味着什么。

# 29. 在不同维度的射影空间中，对偶关系是什么？

在 $\mathbb P^2$ 中

| 原空间对象      | 对偶空间对象    |
| --------------- | --------------- |
| 射影点（0维）   | 射影直线（1维） |
| 射影直线（1维） | 射影点（0维）   |

因为：

$$ 2-0-1=1, $$

$$ 2-1-1=0. $$

在 $\mathbb P^3$ 中

| 原空间对象      | 对偶空间对象    |
| --------------- | --------------- |
| 射影点（0维）   | 射影平面（2维） |
| 射影直线（1维） | 射影直线（1维） |
| 射影平面（2维） | 射影点（0维）   |

因为：

$$ 3-0-1=2, $$

$$ 3-1-1=1, $$

$$ 3-2-1=0. $$

在 $\mathbb P^4$ 中

| 原空间对象        | 对偶空间对象      |
| ----------------- | ----------------- |
| 射影点（0维）     | 三维超平面（3维） |
| 射影直线（1维）   | 射影平面（2维）   |
| 射影平面（2维）   | 射影直线（1维）   |
| 三维超平面（3维） | 射影点（0维）     |

现在可以得出一个重要结论：

$$ \boxed{ \text{射影对偶性并不意味着在所有维度中点与直线互换} } $$

更准确地说：

$$ \boxed{ \text{点与超平面互换} } $$

是一般规律。

而在：

$$ \mathbb P^2 $$

中，超平面恰好是直线。

因此才表现为非常漂亮的点线对偶。

另外：

$$ \mathbb P^3 $$

中有一个特殊现象：

$$ \boxed{ \text{射影直线的对偶仍然是一条射影直线} } $$

不过它位于对偶射影空间中，而不是自动等于原来的直线。

# 30. 一个 $\mathbb P^3$ 的具体对偶例子

现在我们看一个四维线性代数例子。

设：

$$ V=\mathbb R^4. $$

所以：

$$ \mathbb P(V)=\mathbb P^3. $$

考虑二维线性子空间：

$$ W= \operatorname{span} \left( \begin{bmatrix} 1\\0\\0\\0 \end{bmatrix}, \begin{bmatrix} 0\\1\\0\\0 \end{bmatrix} \right). $$

它包含所有形如：

$$ \mathbf w= \begin{bmatrix} s\\t\\0\\0 \end{bmatrix} $$

的向量。

因此：

$$ \mathbb P(W) $$

是：

$$ \mathbb P^3 $$

中的一条射影直线：

$$ \boxed{ L=\{[s:t:0:0]:(s,t)\neq(0,0)\} } $$

现在要求它的零化子：

$$ W^0. $$

取一般线性泛函：

$$ \varphi(x_0,x_1,x_2,x_3) = a_0x_0+a_1x_1+a_2x_2+a_3x_3. $$

要求它对所有：

$$ \mathbf w= \begin{bmatrix} s\\t\\0\\0 \end{bmatrix} $$

都为零。

所以：

$$ a_0s+a_1t=0 $$

对于任意 $s,t\in\mathbb R$ 成立。

这要求：

$$ a_0=0, $$

$$ a_1=0. $$

而：

$$ a_2,a_3 $$

可以任意取值。

因此：

$$ W^0= \left\{ (0,0,a_2,a_3): a_2,a_3\in\mathbb R \right\}, $$

这里四元组是线性泛函的对偶坐标。

所以：

$$ \dim W^0=2. $$

射影化：

$$ \boxed{ L^* = \{[0:0:a_2:a_3]:(a_2,a_3)\neq(0,0)\} } $$

它在对偶：

$$ \mathbb P(V^*) $$

中也是一条射影直线。

这严格验证了：

$$ \boxed{ \mathbb P^3\text{ 中的直线} \longleftrightarrow \text{对偶 }\mathbb P^3\text{ 中的直线} } $$

# 31. 对偶两次，能不能回到原来的子空间？

这是非常自然的问题。

假设：

$$ W\subseteq V. $$

第一次取零化子：

$$ W^0\subseteq V^*. $$

现在再对 $W^0$ 取零化子：

$$ (W^0)^0\subseteq V^{**}. $$

这里出现了：

$$ V^{**}. $$

它叫：

$$ \boxed{ \text{Double Dual Space（双对偶空间）} } $$

那么：

$$ (W^0)^0 $$

和原来的 $W$ 有什么关系？

对于有限维向量空间，有一个非常漂亮的结论：

$$ \boxed{ (W^0)^0=W } $$

这里需要先通过自然映射：

$$ V\cong V^{**} $$

把两个空间识别起来。

我们一步一步理解。

## 第一步：定义从 $V$ 到 $V^{**}$ 的自然映射

对于：

$$ \mathbf v\in V, $$

定义一个作用于 $V^*$ 的线性泛函：

$$ J(\mathbf v):V^*\to\mathbb R. $$

规则是：

$$ \boxed{ J(\mathbf v)(\varphi)=\varphi(\mathbf v) } $$

也就是说：

- $\mathbf v$ 是原空间中的向量；
- $\varphi$ 是原空间上的线性泛函；
- $J(\mathbf v)$ 是对这些线性泛函再次求值的函数。

所以：

$$ J(\mathbf v)\in V^{**}. $$

并且 $J$ 是线性的。

## 第二步：证明 $J$ 是单射

假设：

$$ J(\mathbf v)=0. $$

那么对所有：

$$ \varphi\in V^* $$

都有：

$$ \varphi(\mathbf v)=0. $$

如果：

$$ \mathbf v\neq0, $$

我们可以把 $\mathbf v$ 扩充为一组基，并定义一个线性泛函，使：

$$ \varphi(\mathbf v)=1. $$

这与刚才的条件矛盾。

所以：

$$ \mathbf v=0. $$

因此：

$$ \ker J=\{\mathbf0\}. $$

所以 $J$ 是单射。

又因为：

$$ \dim V=\dim V^{**}, $$

对于有限维空间，单射必然也是满射。

因此：

$$ \boxed{ V\cong V^{**} } $$

而且这个同构不需要选择内积或基。

这和：

$$ V\cong V^* $$

通常需要额外选择，是非常重要的区别。

## 第三步：证明 $(W^0)^0=W$

取：

$$ \mathbf w\in W. $$

对于任意：

$$ \varphi\in W^0, $$

根据零化子的定义：

$$ \varphi(\mathbf w)=0. $$

因此：

$$ J(\mathbf w)\in(W^0)^0. $$

所以：

$$ J(W)\subseteq(W^0)^0. $$

现在计算维数。

设：

$$ \dim V=N, \qquad \dim W=k. $$

我们已经证明：

$$ \dim W^0=N-k. $$

所以：

$$ \dim(W^0)^0 = \dim V^*-\dim W^0. $$

因为：

$$ \dim V^*=N, $$

因此：

$$ \dim(W^0)^0 = N-(N-k). $$

得到：

$$ \dim(W^0)^0=k. $$

而：

$$ \dim J(W)=k. $$

两个空间具有相同维数，并且：

$$ J(W)\subseteq(W^0)^0. $$

所以：

$$ J(W)=(W^0)^0. $$

通过自然识别：

$$ V\cong V^{**}, $$

我们得到：

$$ \boxed{ (W^0)^0=W } $$

因此：

$$ \boxed{ \text{射影对偶两次，可以自然地回到原来的射影子空间} } $$

这就是对偶性真正的双向结构。

# 32. 为什么射影点按照 $H$ 变换，而直线按照 $H^{-T}$ 变换？

现在我们重新研究第四章中的一个重要公式。

当时我们已经推导：

$$ \boxed{ \mathbf p'\sim H\mathbf p } $$

而：

$$ \boxed{ \mathbf l'\sim H^{-T}\mathbf l } $$

现在学过对偶空间以后，我们可以给出一个更本质的解释。

## 32.1 先定义向量空间变换

设：

$$ H:V\to V $$

是一个可逆线性变换。

原来的向量：

$$ \mathbf v $$

变为：

$$ \mathbf v'=H\mathbf v. $$

现在考虑一个原来的线性泛函：

$$ \varphi\in V^*. $$

我们希望找到一个新的线性泛函：

$$ \varphi'\in V^*, $$

使得：

$$ \boxed{ \varphi'(\mathbf v')=\varphi(\mathbf v) } $$

这个要求意味着：

> 原来测量得到多少，变换以后用相应变换过的测量规则，仍然得到相同的数值。

## 32.2 代入 $\mathbf v'=H\mathbf v$

要求：

$$ \varphi'(H\mathbf v)=\varphi(\mathbf v). $$

因为：

$$ H $$

可逆，所以：

$$ \mathbf v=H^{-1}\mathbf v'. $$

因此可以定义：

$$ \boxed{ \varphi'=\varphi\circ H^{-1} } $$

这里：

$$ \circ $$

表示函数复合。

也就是说：

$$ \varphi'(\mathbf v') = \varphi(H^{-1}\mathbf v'). $$

这就是对偶向量应该遵循的变换规律。

## 32.3 把它转换成矩阵形式

假设使用列向量：

$$ \mathbf v, $$

并用列向量：

$$ \mathbf l $$

存储线性泛函的系数。

于是：

$$ \varphi(\mathbf v) = \mathbf l^{\mathsf T}\mathbf v. $$

我们希望：

$$ \varphi'(\mathbf v') = \mathbf l'^{\mathsf T}\mathbf v'. $$

根据：

$$ \varphi'(\mathbf v') = \varphi(H^{-1}\mathbf v'), $$

得到：

$$ \mathbf l'^{\mathsf T}\mathbf v' = \mathbf l^{\mathsf T}H^{-1}\mathbf v'. $$

因为等式对所有 $\mathbf v'$ 都成立，所以：

$$ \mathbf l'^{\mathsf T} = \mathbf l^{\mathsf T}H^{-1}. $$

两边转置：

$$ \boxed{ \mathbf l'=H^{-T}\mathbf l } $$

其中：

$$ H^{-T}=(H^{-1})^{\mathsf T}. $$

这就是第四章公式的真正来源。

因此：

$$ \boxed{ \text{原空间的变换 }H \quad\Longrightarrow\quad \text{对偶空间的对应变换 }H^{-T} } $$

如果只讨论射影坐标，则两边都允许额外的非零缩放因子。

# 33. 用一个数值例子验证 $H^{-T}$

我们取一个最简单的二维仿射平移。

设：

$$ H= \begin{bmatrix} 1&0&2\\ 0&1&0\\ 0&0&1 \end{bmatrix}. $$

它表示：

$$ X'=X+2, $$

$$ Y'=Y. $$

现在取原来的射影直线：

$$ X=1. $$

齐次方程：

$$ x-w=0. $$

因此：

$$ \mathbf l= \begin{bmatrix} 1\\0\\-1 \end{bmatrix}. $$

现在问：这条直线平移以后应该变成什么？

从直觉看：

$$ X=1 $$

向右平移 $2$，所以应该变成：

$$ X'=3. $$

新的齐次方程应该是：

$$ x'-3w'=0. $$

所以我们期望：

$$ \mathbf l'= \begin{bmatrix} 1\\0\\-3 \end{bmatrix}. $$

现在通过矩阵计算验证。

首先：

$$ H^{-1} = \begin{bmatrix} 1&0&-2\\ 0&1&0\\ 0&0&1 \end{bmatrix}. $$

因此：

$$ H^{-T} = \begin{bmatrix} 1&0&0\\ 0&1&0\\ -2&0&1 \end{bmatrix}. $$

计算：

$$ \mathbf l'=H^{-T}\mathbf l. $$

代入：

$$ \mathbf l' = \begin{bmatrix} 1&0&0\\ 0&1&0\\ -2&0&1 \end{bmatrix} \begin{bmatrix} 1\\0\\-1 \end{bmatrix}. $$

逐行计算：

$$ l_1'=1, $$

$$ l_2'=0, $$

$$ l_3'=-2-1=-3. $$

所以：

$$ \boxed{ \mathbf l'= \begin{bmatrix} 1\\0\\-3 \end{bmatrix} } $$

确实得到：

$$ \boxed{ X'=3 } $$

所以：

$$ H^{-T} $$

不是为了让公式漂亮而人为选择的。

它是保持点与超平面关联关系所必需的变换。

# 34. 叉积和 $H^{-T}$ 之间还有一个漂亮的恒等式

这一步可以帮助你彻底统一：

- 两点定直线；
- 射影变换；
- 对偶向量的变换规律。

设：

$$ H\in GL(3,\mathbb R). $$

取两个线性无关的向量：

$$ \mathbf u,\mathbf v\in\mathbb R^3. $$

我们有：

$$ \boxed{ (H\mathbf u)\times(H\mathbf v) = (\det H)H^{-T}(\mathbf u\times\mathbf v) } $$

这是三维线性代数中的一个重要恒等式。

我们来证明。

取任意向量：

$$ \mathbf r\in\mathbb R^3. $$

考虑：

$$ (H\mathbf r)^{\mathsf T} \bigl((H\mathbf u)\times(H\mathbf v)\bigr). $$

利用标量三重积与行列式的关系：

$$ \mathbf a^{\mathsf T}(\mathbf b\times\mathbf c) = \det[\mathbf b\ \mathbf c\ \mathbf a]. $$

因此：

$$ (H\mathbf r)^{\mathsf T} \bigl((H\mathbf u)\times(H\mathbf v)\bigr) = \det[ H\mathbf u\ H\mathbf v\ H\mathbf r ]. $$

提出矩阵 $H$：

$$ = \det\left( H[\mathbf u\ \mathbf v\ \mathbf r] \right). $$

根据行列式乘法性质：

$$ = (\det H) \det[\mathbf u\ \mathbf v\ \mathbf r]. $$

重新使用标量三重积：

$$ = (\det H) \mathbf r^{\mathsf T}(\mathbf u\times\mathbf v). $$

另一方面：

$$ (H\mathbf r)^{\mathsf T} \left[ (\det H)H^{-T}(\mathbf u\times\mathbf v) \right] $$

等于：

$$ (\det H) \mathbf r^{\mathsf T} H^{\mathsf T}H^{-T} (\mathbf u\times\mathbf v). $$

因为：

$$ H^{\mathsf T}H^{-T}=I, $$

所以：

$$ = (\det H) \mathbf r^{\mathsf T}(\mathbf u\times\mathbf v). $$

两种表达完全相同。

因此对于任意：

$$ \mathbf r, $$

都有：

$$ (H\mathbf r)^{\mathsf T} \bigl((H\mathbf u)\times(H\mathbf v)\bigr) = (H\mathbf r)^{\mathsf T} \left[ (\det H)H^{-T}(\mathbf u\times\mathbf v) \right]. $$

由于 $H$ 可逆，$H\mathbf r$ 可以遍历整个 $\mathbb R^3$。

所以两个被比较的向量必须相等。

得到：

$$ \boxed{ (H\mathbf u)\times(H\mathbf v) = (\det H)H^{-T}(\mathbf u\times\mathbf v) } $$

现在把：

$$ \mathbf u=\mathbf p_1, \qquad \mathbf v=\mathbf p_2. $$

那么：

$$ \mathbf l=\mathbf p_1\times\mathbf p_2. $$

变换两个点后，新直线：

$$ \mathbf l' = (H\mathbf p_1)\times(H\mathbf p_2). $$

利用刚才的恒等式：

$$ \mathbf l' = (\det H)H^{-T}\mathbf l. $$

因为射影坐标允许忽略非零比例：

$$ \det H\neq0, $$

所以：

$$ \boxed{ \mathbf l'\sim H^{-T}\mathbf l } $$

因此我们发现：

$$ \boxed{ \text{两点定直线公式与对偶变换公式完全兼容} } $$

这就是射影几何中代数结构相互吻合的一个精彩例子。

# 35. 对偶性和圆锥曲线有什么关系？

现在我们进入一个新的概念：

$$ \boxed{ \text{Polarity（极性对应）} } $$

它会把对偶空间和你已经学过的圆锥曲线联系起来。

首先要明确：

前面讲的射影对偶性，并没有自动指定一个射影点应该对应原空间中的哪条特定直线。

它自然地把原空间中的一个点 $P$ 对应为对偶空间中的超平面 $P^*$。

但如果我们想在同一个射影平面中建立具体的一对一对应：

$$ \boxed{ \text{点}\longleftrightarrow\text{直线} } $$

就需要额外的几何结构。

一个经典办法是选择一条非退化圆锥曲线。

# 36. 圆锥曲线的矩阵表示

考虑：

$$ \mathbb P^2. $$

射影点的齐次代表：

$$ \mathbf p= \begin{bmatrix} x\\y\\w \end{bmatrix}. $$

假设有一个对称矩阵：

$$ C= \begin{bmatrix} c\_{11}&c\_{12}&c\_{13}\\ c\_{12}&c\_{22}&c\_{23}\\ c\_{13}&c\_{23}&c\_{33} \end{bmatrix}. $$

要求：

$$ C^{\mathsf T}=C, $$

以及：

$$ \det C\neq0. $$

那么：

$$ \boxed{ \mathbf p^{\mathsf T}C\mathbf p=0 } $$

定义一条非退化的射影圆锥曲线。

这里的非退化是指矩阵 $C$ 可逆。

例如圆：

$$ X^2+Y^2=1. $$

齐次化：

$$ x^2+y^2-w^2=0. $$

它可以写成：

$$ \mathbf p^{\mathsf T}C\mathbf p=0, $$

其中：

$$ \boxed{ C= \begin{bmatrix} 1&0&0\\ 0&1&0\\ 0&0&-1 \end{bmatrix} } $$

因为：

$$ \mathbf p^{\mathsf T}C\mathbf p = x^2+y^2-w^2. $$

并且：

$$ \det C=-1\neq0. $$

所以这是一条非退化实射影圆锥曲线。

# 37. 极线（Polar Line）是什么？

现在设：

$$ P=[\mathbf p] $$

是一个任意射影点。

这里暂时不要求 $P$ 位于圆锥曲线上。

我们定义它对应的极线：

$$ \boxed{ \mathbf l=C\mathbf p } $$

其中 $\mathbf l$ 被解释为一个对偶向量的系数。

因此极线方程：

$$ \mathbf l^{\mathsf T}\mathbf x=0. $$

代入：

$$ \mathbf l=C\mathbf p. $$

得到：

$$ (C\mathbf p)^{\mathsf T}\mathbf x=0. $$

因为：

$$ C^{\mathsf T}=C, $$

所以：

$$ \boxed{ \mathbf p^{\mathsf T}C\mathbf x=0 } $$

这条直线叫点 $P$ 关于圆锥曲线 $C$ 的：

$$ \boxed{ \text{Polar Line（极线）} } $$

反过来，一条直线 $\ell$ 对应的点叫：

$$ \boxed{ \text{Pole（极点）} } $$

如果：

$$ \mathbf l=C\mathbf p, $$

由于 $C$ 可逆，所以：

$$ \boxed{ \mathbf p=C^{-1}\mathbf l } $$

这就建立了一个可逆的点线对应。

注意齐次坐标中等式都可以理解为非零比例意义下的等式。

# 38. 一个具体例子：圆与极线

还是考虑圆：

$$ x^2+y^2-w^2=0. $$

对应：

$$ C= \begin{bmatrix} 1&0&0\\ 0&1&0\\ 0&0&-1 \end{bmatrix}. $$

现在取射影点：

$$ P=[2:0:1]. $$

它对应普通仿射点：

$$ (2,0). $$

这个点位于单位圆的外部。

计算极线：

$$ \mathbf l=C\mathbf p. $$

即：

$$ \mathbf l= \begin{bmatrix} 1&0&0\\ 0&1&0\\ 0&0&-1 \end{bmatrix} \begin{bmatrix} 2\\0\\1 \end{bmatrix}. $$

得到：

$$ \mathbf l= \begin{bmatrix} 2\\0\\-1 \end{bmatrix}. $$

所以极线方程：

$$ \boxed{ 2x-w=0 } $$

在：

$$ w=1 $$

的仿射图中：

$$ 2X-1=0. $$

于是：

$$ \boxed{ X=\frac12 } $$

这是一条竖直直线。

它和单位圆有两个交点。

求交点时：

$$ X=\frac12, $$

以及：

$$ X^2+Y^2=1. $$

代入：

$$ \frac14+Y^2=1. $$

所以：

$$ Y^2=\frac34. $$

因此：

$$ Y=\pm\frac{\sqrt3}{2}. $$

交点为：

$$ \boxed{ \left(\frac12,\frac{\sqrt3}{2}\right) } $$

和：

$$ \boxed{ \left(\frac12,-\frac{\sqrt3}{2}\right) } $$

对于这个外部点 $P=(2,0)$，这两个交点正好也是从 $P$ 向圆所作两条切线的切点。

所以它的极线连接两个切点。

这不是所有极线在实数域下都具有的几何表现，但它是外部点与实圆锥曲线的一个经典例子。

# 39. 为什么圆锥曲线上某点的极线恰好是切线？

现在我们严格证明。

设圆锥曲线：

$$ F(\mathbf x)=\mathbf x^{\mathsf T}C\mathbf x=0. $$

其中：

$$ C^{\mathsf T}=C, \qquad \det C\neq0. $$

取圆锥曲线上的一点：

$$ P=[\mathbf p]. $$

因此：

$$ \mathbf p^{\mathsf T}C\mathbf p=0. $$

我们希望求经过 $P$ 的切线。

考虑通过 $P$ 的一个齐次方向扰动：

$$ \mathbf x(t)=\mathbf p+t\mathbf v. $$

其中：

$$ \mathbf v\in\mathbb R^3. $$

把它代入圆锥曲线方程：

$$ F(\mathbf x(t)) = (\mathbf p+t\mathbf v)^{\mathsf T} C (\mathbf p+t\mathbf v). $$

完全展开：

$$ = \mathbf p^{\mathsf T}C\mathbf p + t\mathbf p^{\mathsf T}C\mathbf v + t\mathbf v^{\mathsf T}C\mathbf p + t^2\mathbf v^{\mathsf T}C\mathbf v. $$

因为 $C$ 对称：

$$ \mathbf p^{\mathsf T}C\mathbf v = \mathbf v^{\mathsf T}C\mathbf p. $$

所以：

$$ F(\mathbf x(t)) = \mathbf p^{\mathsf T}C\mathbf p + 2t\mathbf p^{\mathsf T}C\mathbf v + t^2\mathbf v^{\mathsf T}C\mathbf v. $$

又因为 $P$ 在圆锥曲线上：

$$ \mathbf p^{\mathsf T}C\mathbf p=0. $$

所以：

$$ F(\mathbf x(t)) = 2t\mathbf p^{\mathsf T}C\mathbf v + t^2\mathbf v^{\mathsf T}C\mathbf v. $$

切线方向要求一阶项消失。

因此：

$$ \mathbf p^{\mathsf T}C\mathbf v=0. $$

由于：

$$ \mathbf p^{\mathsf T}C\mathbf p=0, $$

所以这条切线上的所有齐次向量 $\mathbf x$ 都满足：

$$ \boxed{ \mathbf p^{\mathsf T}C\mathbf x=0 } $$

于是切线的系数向量为：

$$ \boxed{ \mathbf l=C\mathbf p } $$

这恰好就是极线的定义。

因此：

$$ \boxed{ \text{圆锥曲线上一点的极线就是该点处的切线} } $$

这个结论把圆锥曲线微分、线性代数和射影对偶性直接联系起来了。

# 40. 再给一个最简单的切线例子

仍然使用单位圆：

$$ x^2+y^2-w^2=0. $$

取圆上的点：

$$ P=[1:0:1]. $$

因为：

$$ 1^2+0^2-1^2=0, $$

所以 $P$ 确实在圆上。

对应：

$$ \mathbf p= \begin{bmatrix} 1\\0\\1 \end{bmatrix}. $$

计算：

$$ C\mathbf p = \begin{bmatrix} 1&0&0\\ 0&1&0\\ 0&0&-1 \end{bmatrix} \begin{bmatrix} 1\\0\\1 \end{bmatrix}. $$

得到：

$$ \mathbf l= \begin{bmatrix} 1\\0\\-1 \end{bmatrix}. $$

所以切线：

$$ x-w=0. $$

在：

$$ w=1 $$

中：

$$ \boxed{ X=1 } $$

这正是单位圆在点：

$$ (1,0) $$

处的竖直切线。

所以：

$$ \boxed{ \text{极性对应} } $$

提供了一种完全使用矩阵运算求圆锥曲线切线的方法。

这对计算机辅助几何设计（CAGD）和计算机视觉都有实际意义。

# 41. 射影对偶性与极性对应有什么区别？

这一点必须明确区分。

射影对偶性是一般性的结构。

它来自：

$$ V $$

和：

$$ V^* $$

之间的自然配对，以及子空间与零化子的对应关系。

不需要指定某条圆锥曲线。

而极性对应是一种额外选择出来的、具体的点与超平面之间的对应。

例如我们选择：

$$ C $$

后，定义：

$$ \mathbf p \longmapsto C\mathbf p. $$

这就建立了：

$$ \mathbb P(V) \to \mathbb P(V^*) $$

的具体映射。

所以：

$$ \boxed{ \text{射影对偶性是一般理论，极性对应是由额外几何结构诱导的具体对偶映射} } $$

还有一个很有意思的对称关系。

对于对称矩阵 $C$，假设：

$$ P\leftrightarrow\ell_P, $$

$$ Q\leftrightarrow\ell_Q. $$

如果：

$$ P\in\ell_Q, $$

那么：

$$ \mathbf q^{\mathsf T}C\mathbf p=0. $$

由于 $C$ 对称：

$$ \mathbf q^{\mathsf T}C\mathbf p = \mathbf p^{\mathsf T}C\mathbf q. $$

因此：

$$ \mathbf p^{\mathsf T}C\mathbf q=0. $$

这意味着：

$$ Q\in\ell_P. $$

所以：

$$ \boxed{ P\in\ell_Q \iff Q\in\ell_P } $$

这是极性理论中的一个经典关系，称为 La Hire 定理。

你现在应该能够理解它为什么成立：根本原因就是矩阵 $C$ 的对称性。

# 42. 最后：整个射影对偶性的知识结构

现在我们可以把这章的知识压缩成一条完整逻辑链。

向量空间

$$ V=\mathbb R^{n+1} $$

原射影空间

$$ \mathbb P(V) $$

由一维线性子空间构成

对偶射影空间

$$ \mathbb P(V^*) $$

由非零线性泛函的等价类构成

自然配对：$\varphi(\mathbf v)=0$

子空间对偶

$$ \mathbb P(W)\longleftrightarrow\mathbb P(W^0) $$

$$ \dim\mathbb P(W^0)=n-\dim\mathbb P(W)-1 $$

其中真正的核心定义只有两个。

第一个是对偶空间：

$$ \boxed{ V^*= \{ \varphi:V\to\mathbb R \mid \varphi\text{ 线性} \} } $$

第二个是零化子：

$$ \boxed{ W^0= \{ \varphi\in V^*: \varphi(\mathbf w)=0 \ \forall\mathbf w\in W \} } $$

从这两个定义出发，我们就得到了：

$$ \boxed{ \dim W+\dim W^0=\dim V } $$

以及：

$$ \boxed{ W_1\subseteq W_2 \Longrightarrow W_2^0\subseteq W_1^0 } $$

这两个性质共同产生了：

$$ \boxed{ \text{射影子空间的对偶维数关系与关联关系反转} } $$

特别是在：

$$ \mathbb P^2 $$

中，表现为：

$$ \boxed{ \begin{aligned} \text{点}&\longleftrightarrow\text{直线},\\ \text{两点定线}&\longleftrightarrow\text{两线定点},\\ \text{三点共线}&\longleftrightarrow\text{三线共点}. \end{aligned} } $$

而：

$$ \boxed{ \mathbf l^{\mathsf T}\mathbf p=0 } $$

则是点线关联关系在选定坐标后的代数表达。

当发生射影变换时：

$$ \boxed{ \mathbf p'\sim H\mathbf p } $$

而：

$$ \boxed{ \mathbf l'\sim H^{-T}\mathbf l } $$

恰好保持这种关联关系。

最后，如果选择一条非退化圆锥曲线：

$$ \mathbf p^{\mathsf T}C\mathbf p=0, $$

还可以构造具体的极性对应：

$$ \boxed{ \mathbf l\sim C\mathbf p } $$

并由此统一极点、极线和圆锥曲线的切线理论。

## 下一章：射影几何中的圆锥曲线（Projective Conics）

下一章最适合继续研究你之前已经接触过的二次曲线：

$$ \boxed{ \text{椭圆、抛物线、双曲线} } $$

但我们会从射影几何角度重新理解它们。

最值得研究的一个问题是：

> 为什么在欧氏几何里，椭圆、抛物线和双曲线是三类不同曲线，但在实射影几何中，所有非退化且具有实点的圆锥曲线都可以通过射影变换相互转换？

我们将从：

$$ \boxed{ \mathbf x^{\mathsf T}C\mathbf x=0 } $$

出发，研究：

- 二次齐次方程如何统一表示圆锥曲线。
- 为什么 $C$ 必须使用对称矩阵，以及矩阵的秩和退化有什么关系。
- 射影变换作用在圆锥曲线上时，为什么矩阵变成 $H^{-T}CH^{-1}$。
- 为什么椭圆、抛物线、双曲线的区别与无穷远直线的交点密切相关。
- 如何从 NURBS 或有理二次曲线出发识别其对应的圆锥曲线类型。
- 为什么分类同一条二次曲线时，必须区分欧氏、仿射和射影三个不同层次。

这将把之前学过的齐次坐标、射影变换、对偶空间、矩阵二次型、圆锥曲线、NURBS真正连接到一起。
