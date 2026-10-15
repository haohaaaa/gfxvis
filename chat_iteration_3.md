第一层先补齐 **齐次的定义**；第二层再进入 **射影子空间、超平面以及 $\mathbb P^n$ 的一般结构**。

---

# 第三部分：齐次、射影子空间与超平面

先统一符号。

我们记

$$
\mathbf x=
\begin{bmatrix}
x_0\\
x_1\\
\vdots\\
x_n
\end{bmatrix}
\in\mathbb R^{n+1}.
$$

而射影空间记作

$$
\mathbb P^n(\mathbb R).
$$

如果上下文明确，就简写为

$$
\mathbb P^n.
$$

---

# 1. “齐次”最基本的意思是什么？

“齐次”英文是

$$
\text{homogeneous}.
$$

它的核心思想是：

$$
\boxed{
\text{整体缩放输入时，输出按照某个固定次数整体缩放}
}
$$

这是最一般的定义。

假设函数

$$
f:\mathbb R^n\to\mathbb R.
$$

如果存在一个数 $d$，使得对任意标量 $\lambda$ 都有

$$
f(\lambda \mathbf x)
=

\lambda^d f(\mathbf x),
$$

那么称 $f$ 是一个 **$d$ 次齐次函数**。

这里：

$$
d
$$

叫做齐次次数，或者 degree of homogeneity。

---

# 2. 最简单的一次齐次例子

考虑

$$
f(x,y)=2x+3y.
$$

现在把输入整体乘上 $\lambda$：

$$
(x,y)\mapsto(\lambda x,\lambda y).
$$

那么

$$
f(\lambda x,\lambda y)
=

2\lambda x+3\lambda y.
$$

提取 $\lambda$：

$$
f(\lambda x,\lambda y)
=

\lambda(2x+3y).
$$

所以

$$
f(\lambda x,\lambda y)
=

\lambda f(x,y).
$$

因此它是一次齐次的。

也就是：

$$
\boxed{
f(\lambda\mathbf x)
=

\lambda f(\mathbf x)
}
$$

---

# 3. 二次齐次例子

考虑

$$
f(x,y)=x^2+xy+y^2.
$$

把输入整体缩放：

$$
(x,y)\mapsto(\lambda x,\lambda y).
$$

那么

$$
f(\lambda x,\lambda y)
=

(\lambda x)^2
+
(\lambda x)(\lambda y)
+
(\lambda y)^2.
$$

逐项展开：

$$
=

\lambda^2x^2
+
\lambda^2xy
+
\lambda^2y^2.
$$

提取：

$$
=

\lambda^2(x^2+xy+y^2).
$$

所以：

$$
f(\lambda x,\lambda y)
=

\lambda^2 f(x,y).
$$

因此这是二次齐次函数。

---

# 4. 什么叫齐次多项式？

如果一个多项式的所有单项式总次数都相同，那么它叫做齐次多项式。

例如：

$$
x^2+xy+y^2
$$

中，

$$
x^2
$$

次数是 $2$，

$$
xy
$$

次数也是 $2$，

$$
y^2
$$

次数也是 $2$。

所以整个多项式是二次齐次的。

再比如：

$$
x^3+2x^2y-xy^2+5y^3
$$

所有单项式总次数都是

$$
3,
$$

所以它是三次齐次多项式。

---

# 5. 一个不是齐次的例子

考虑

$$
f(x,y)=x+y+1.
$$

这里：

$$
x
$$

和

$$
y
$$

是一次项，

但是

$$
1
$$

是零次项。

所以各项次数不同。

我们直接验证。

输入缩放为：

$$
(\lambda x,\lambda y).
$$

则

$$
f(\lambda x,\lambda y)
=

\lambda x+\lambda y+1.
$$

而

$$
\lambda f(x,y)
=

\lambda x+\lambda y+\lambda.
$$

一般情况下：

$$
\lambda x+\lambda y+1
\neq
\lambda x+\lambda y+\lambda.
$$

所以：

$$
f(\lambda x,\lambda y)
\neq
\lambda f(x,y).
$$

也不等于固定的

$$
\lambda^d f(x,y).
$$

因此它不是齐次的。

---

# 6. 为什么射影几何特别需要齐次方程？

现在终于进入关键点。

在射影空间里，

$$
\mathbf x
$$

和

$$
\lambda\mathbf x
$$

代表同一个射影点：

$$
[\mathbf x]
=

[\lambda\mathbf x],
\qquad
\lambda\neq0.
$$

所以如果你想定义一个几何对象，比如：

$$
F(\mathbf x)=0,
$$

那么这个条件必须不能依赖于你选了哪个代表向量。

也就是说，如果

$$
F(\mathbf x)=0,
$$

那么必须自动有：

$$
F(\lambda\mathbf x)=0.
$$

如果 $F$ 是 $d$ 次齐次函数，那么

$$
F(\lambda\mathbf x)
=

\lambda^dF(\mathbf x).
$$

如果原本

$$
F(\mathbf x)=0,
$$

那么：

$$
F(\lambda\mathbf x)
=

\lambda^d\cdot0
=

0.

$$

于是条件在整个等价类上保持不变。

所以：

$$
\boxed{
齐次方程天然适合定义射影空间中的几何对象
}
$$

这就是“齐次”在射影几何中如此核心的原因。

---

# 7. 为什么

$$
ax+by+cw=0
$$

是齐次的？

定义

$$
F(x,y,w)=ax+by+cw.
$$

整体缩放：

$$
(x,y,w)
\mapsto
(\lambda x,\lambda y,\lambda w).
$$

则：

$$
F(\lambda x,\lambda y,\lambda w)
=

a\lambda x+b\lambda y+c\lambda w.
$$

提取：

$$
=

\lambda(ax+by+cw).
$$

所以：

$$
F(\lambda x,\lambda y,\lambda w)
=

\lambda F(x,y,w).
$$

因此它是一次齐次方程。

所以：

$$
ax+by+cw=0
$$

可以合法地定义

$$
\mathbb P^2
$$

中的一条射影直线。

---

# 8. 那

$$
ax+by+c=0
$$

为什么不是射影方程？

因为它不齐次。

设

$$
F(x,y)=ax+by+c.
$$

缩放以后：

$$
F(\lambda x,\lambda y)
=

a\lambda x+b\lambda y+c.
$$

但

$$
\lambda F(x,y)
=

\lambda ax+\lambda by+\lambda c.
$$

两者通常不同。

所以同一个射影点的不同代表：

$$
(x,y)
$$

和

$$
(\lambda x,\lambda y)
$$

可能一个满足方程，另一个不满足。

那就没法定义一个射影对象。

---

# 9. “齐次化”到底是什么意思？

现在可以严格说这个词了。

假设我们有一个普通仿射方程：

$$
F(X,Y)=0.
$$

我们引入齐次坐标：

$$
X=\frac{x}{w},
\qquad
Y=\frac{y}{w}.
$$

然后把方程改写成：

$$
F\left(
\frac{x}{w},
\frac{y}{w}
\right)=0.
$$

再乘上适当次数的 $w$，让所有项总次数相同。

这个过程叫：

$$
\boxed{
\text{homogenization}
}
$$

即：

$$
\boxed{
\text{齐次化}
}
$$

---

# 10. 一个一次方程的齐次化例子

仿射直线：

$$
X+2Y-3=0.
$$

代入：

$$
X=\frac{x}{w},
\qquad
Y=\frac{y}{w}.
$$

得到：

$$
\frac{x}{w}
+
2\frac{y}{w}
-

3
=

0.

$$

乘以 $w$：

$$
x+2y-3w=0.
$$

现在三项：

$$
x,
\qquad
2y,
\qquad
-3w
$$

都是一次项。

所以这是一次齐次方程。

---

# 11. 二次方程怎么齐次化？

考虑一个圆：

$$
X^2+Y^2=1.
$$

也就是：

$$
X^2+Y^2-1=0.
$$

代入：

$$
X=\frac{x}{w},
\qquad
Y=\frac{y}{w}.
$$

得到：

$$
\frac{x^2}{w^2}
+
\frac{y^2}{w^2}
-

1
=

0.

$$

乘以 $w^2$：

$$
x^2+y^2-w^2=0.
$$

现在每一项都是二次：

$$
x^2,
\qquad
y^2,
\qquad
w^2.
$$

所以：

$$
\boxed{
x^2+y^2-w^2=0
}
$$

是二次齐次方程。

这就是圆在射影平面中的射影闭包。

---

# 12. 再看抛物线

仿射抛物线：

$$
Y=X^2.
$$

写成：

$$
X^2-Y=0.
$$

这里：

$$
X^2
$$

是二次，

而

$$
Y
$$

是一次。

所以它作为仿射方程当然没问题，但不是齐次方程。

代入：

$$
X=\frac{x}{w},
\qquad
Y=\frac{y}{w}.
$$

得到：

$$
\frac{x^2}{w^2}
-

\frac{y}{w}
=

0.

$$

乘以 $w^2$：

$$
x^2-yw=0.
$$

现在：

$$
x^2
$$

总次数为 $2$，

而

$$
yw
$$

总次数也为 $2$。

于是：

$$
\boxed{
x^2-yw=0
}
$$

是抛物线的齐次形式。

---

# 13. 齐次坐标为什么也叫“齐次”？

现在可以把另一个“齐次”解释清楚。

射影坐标

$$
[x_0:x_1:\cdots:x_n]
$$

具有：

$$
[x_0:\cdots:x_n]
=

[\lambda x_0:\cdots:\lambda x_n].
$$

也就是说：

> 坐标只在整体比例意义下有定义。

因此这组坐标叫：

$$
\boxed{
\text{homogeneous coordinates}
}
$$

它和“齐次多项式”的“齐次”共享同一个核心思想：

$$
\boxed{
整体缩放
}
$$

只是表现形式不同。

齐次坐标：

$$
\mathbf x
\sim
\lambda\mathbf x.
$$

齐次函数：

$$
F(\lambda\mathbf x)
=

\lambda^dF(\mathbf x).
$$

正因为这两者的缩放规律兼容，所以：

$$
F(\mathbf x)=0
$$

能很好地定义射影几何对象。

这是非常核心的联系。

---

# 14. 现在正式进入射影子空间

上一章我们已经看到：

在

$$
\mathbb P^2
$$

里面，一个点对应

$$
\mathbb R^3
$$

中的一维线性子空间。

一条射影直线对应

$$
\mathbb R^3
$$

中的二维线性子空间。

你应该已经开始看到规律：

$$
1\text{ 维线性子空间}
\longleftrightarrow
0\text{ 维射影对象},
$$

$$
2\text{ 维线性子空间}
\longleftrightarrow
1\text{ 维射影对象}.
$$

所以一般规律就是：

$$
\boxed{
(k+1)\text{维线性子空间}
\longleftrightarrow
k\text{维射影子空间}
}
$$

---

# 15. 为什么维数会少 1？

这是非常值得理解的。

设

$$
W
\subseteq
\mathbb R^{n+1}
$$

是一个

$$
(k+1)
$$

维线性子空间。

如果我们直接看 $W$，它有 $k+1$ 个自由度。

但是射影化以后，我们规定：

$$
\mathbf x
\sim
\lambda\mathbf x.
$$

也就是说整体缩放这个自由度不再算作新的点。

因此少掉一个自由度：

$$
(k+1)-1=k.
$$

所以：

$$
\boxed{
\dim\mathbb P(W)
=

\dim W-1
}
$$

这就是射影维数总比对应向量空间维数少 $1$ 的根源。

---

# 16. 一个射影点为什么是零维对象？

一个射影点对应

$$
\mathbb R^{n+1}
$$

中的一维线性子空间：

$$
W=\operatorname{span}(\mathbf v).
$$

所以：

$$
\dim W=1.
$$

射影化之后：

$$
\dim\mathbb P(W)
=

1-1
=

0.

$$

因此射影点是零维对象。

这和我们平常的直觉一致：

$$
\boxed{
\text{点的维数是 }0
}
$$

---

# 17. 射影直线为什么对应二维线性子空间？

假设：

$$
W
=

\operatorname{span}(\mathbf p_1,\mathbf p_2),
$$

其中

$$
\mathbf p_1,\mathbf p_2
$$

线性无关。

所以：

$$
\dim W=2.
$$

那么：

$$
\dim\mathbb P(W)
=

2-1
=

1.

$$

因此它对应一条一维射影子空间。

也就是：

$$
\boxed{
\text{射影直线}
}
$$

所以射影直线的本质不是：

> $\mathbb R^{n+1}$ 里面的一条线。

恰恰相反：

$$
\boxed{
\mathbb P^n\text{ 中的射影直线}
=

\mathbb R^{n+1}\text{ 中二维线性子空间的射影化}
}
$$

---

# 18. 具体看 $\mathbb P^2$

在

$$
\mathbb P^2
$$

中，底层向量空间是

$$
\mathbb R^3.
$$

因此可能的非平凡线性子空间维数是：

$$
1,\quad2,\quad3.
$$

对应的射影维数分别是：

$$
0,\quad1,\quad2.
$$

也就是说：

$$
\mathbb R^3
\text{ 中一维线性子空间}
\leftrightarrow
\mathbb P^2
\text{ 中的点},
$$

$$
\mathbb R^3
\text{ 中二维线性子空间}
\leftrightarrow
\mathbb P^2
\text{ 中的直线},
$$

$$
\mathbb R^3
\text{ 本身}
\leftrightarrow
\mathbb P^2
\text{ 本身}.
$$

---

# 19. $\mathbb P^3$ 中情况更丰富

现在看：

$$
\mathbb P^3.
$$

它来自：

$$
\mathbb R^4.
$$

那么：

$$
\mathbb R^4
$$

中的一维线性子空间，对应射影点。

二维线性子空间，对应射影直线。

三维线性子空间，对应射影平面。

四维空间本身，对应整个

$$
\mathbb P^3.
$$

所以：

$$
\boxed{
\mathbb P^3
\text{ 中确实同时存在点、线、面}
}
$$

---

# 20. 射影平面为什么对应三维线性子空间？

设：

$$
W\subset\mathbb R^4
$$

满足：

$$
\dim W=3.
$$

射影化后：

$$
\dim\mathbb P(W)
=

3-1
=

2.

$$

所以：

$$
\mathbb P(W)
$$

是一个二维射影子空间。

因此叫：

$$
\boxed{
\text{射影平面}
}
$$

---

# 21. 一般定义

现在可以正式定义：

设

$$
V
$$

是一个向量空间，

并且

$$
W\subseteq V
$$

是一个非零线性子空间。

那么定义：

$$
\boxed{
\mathbb P(W)
=

\{
[\mathbf w]:
\mathbf w\in W\setminus\{\mathbf0\}
\}
}
$$

这叫做：

$$
\boxed{
\mathbb P(V)
\text{ 中的一个射影子空间}
}
$$

如果：

$$
\dim W=k+1,
$$

那么：

$$
\boxed{
\dim\mathbb P(W)=k
}
$$

---

# 22. 用 span 描述一条射影直线

假设射影空间里有两个不同的点：

$$
P_1=[\mathbf p_1],
$$

$$
P_2=[\mathbf p_2].
$$

因为它们不同，所以：

$$
\mathbf p_1,\mathbf p_2
$$

线性无关。

它们张成二维线性子空间：

$$
W=
\operatorname{span}(\mathbf p_1,\mathbf p_2).
$$

于是射影直线就是：

$$
\boxed{
\mathbb P(W)
=

\mathbb P(
\operatorname{span}(\mathbf p_1,\mathbf p_2)
)
}
$$

因此任何直线上的点都可以写成：

$$
[\alpha\mathbf p_1+\beta\mathbf p_2].
$$

其中：

$$
(\alpha,\beta)\neq(0,0).
$$

注意必须排除

$$
\alpha=\beta=0,
$$

因为那样得到零向量，而零向量没有射影点。

---

# 23. 一个具体例子

取：

$$
\mathbf p_1=
\begin{bmatrix}
1\\0\\1
\end{bmatrix},
$$

$$
\mathbf p_2=
\begin{bmatrix}
0\\1\\1
\end{bmatrix}.
$$

那么它们张成：

$$
W
=

\left\{
\alpha
\begin{bmatrix}
1\\0\\1
\end{bmatrix}
+
\beta
\begin{bmatrix}
0\\1\\1
\end{bmatrix}
:
\alpha,\beta\in\mathbb R
\right\}.
$$

展开：

$$
W
=

\left\{
\begin{bmatrix}
\alpha\\
\beta\\
\alpha+\beta
\end{bmatrix}
\right\}.
$$

所以射影直线上的点是：

$$
[\alpha:\beta:\alpha+\beta].
$$

如果：

$$
\alpha+\beta\neq0,
$$

可以归一化：

$$
w=1.
$$

于是：

$$
X=
\frac{\alpha}{\alpha+\beta},
$$

$$
Y=
\frac{\beta}{\alpha+\beta}.
$$

相加：

$$
X+Y
=

\frac{\alpha+\beta}{\alpha+\beta}
=

1.

$$

所以普通仿射部分满足：

$$
\boxed{
X+Y=1
}
$$

这正是一条普通直线。

---

# 24. 那无穷远点在哪里？

对于刚才的直线：

$$
[\alpha:\beta:\alpha+\beta],
$$

无穷远点满足：

$$
w=0.
$$

因此：

$$
\alpha+\beta=0.
$$

所以：

$$
\beta=-\alpha.
$$

于是：

$$
[\alpha:-\alpha:0].
$$

只要：

$$
\alpha\neq0,
$$

都等价于：

$$
\boxed{
[1:-1:0]
}
$$

所以这条仿射直线：

$$
X+Y=1
$$

的方向点就是：

$$
[1:-1:0].
$$

这和它的方向向量

$$
(1,-1)
$$

完全吻合。

---

# 25. 什么叫超平面？

现在进入一个非常重要的概念：

$$
\boxed{
\text{hyperplane}
}
$$

中文叫：

$$
\boxed{
\text{超平面}
}
$$

在一个 $n$ 维空间中，**余维数为 $1$** 的子空间叫超平面。

也就是说，如果环境空间维数是：

$$
n,
$$

那么超平面的维数是：

$$
n-1.
$$

---

# 26. 在线性空间里看超平面

在：

$$
\mathbb R^n
$$

中，一个线性超平面可以写成：

$$
a_1x_1+\cdots+a_nx_n=0,
$$

其中：

$$
(a_1,\ldots,a_n)\neq0.
$$

这是一个过原点的

$$
(n-1)
$$

维线性子空间。

例如在：

$$
\mathbb R^3
$$

中，

$$
ax+by+cz=0
$$

是二维平面。

而：

$$
2=3-1.
$$

所以它是超平面。

---

# 27. 在 $\mathbb R^2$ 中超平面是什么？

环境维数：

$$
2.
$$

所以超平面维数：

$$
2-1=1.
$$

因此在

$$
\mathbb R^2
$$

中，超平面其实就是：

$$
\boxed{
\text{过原点的直线}
}
$$

所以“超平面”不是一定长得像我们平常说的“平面”。

它是一个相对概念。

---

# 28. 在 $\mathbb R^4$ 中超平面是什么？

环境维数：

$$
4.
$$

超平面维数：

$$
4-1=3.
$$

所以：

$$
a_1x_1+a_2x_2+a_3x_3+a_4x_4=0
$$

描述的是一个三维线性子空间。

虽然我们无法直接画出来，但它仍然叫：

$$
\boxed{
\text{超平面}
}
$$

---

# 29. 那 $\mathbb P^n$ 中的超平面呢？

这个地方特别容易混。

$$
\mathbb P^n
$$

的射影维数是：

$$
n.
$$

所以其中的射影超平面维数是：

$$
n-1.
$$

而射影维数 $n-1$ 的对象，对应底层向量空间中：

$$
n
$$

维线性子空间。

所以：

$$
\boxed{
\mathbb P^n
\text{ 中的超平面}
\leftrightarrow
\mathbb R^{n+1}
\text{ 中的 }n\text{ 维线性子空间}
}
$$

也就是：

$$
\mathbb R^{n+1}
$$

中的线性超平面。

---

# 30. 射影超平面的方程

在：

$$
\mathbb P^n
$$

中，取齐次坐标：

$$
\mathbf x=
[x_0:x_1:\cdots:x_n].
$$

一个射影超平面由一次齐次方程：

$$
a_0x_0+a_1x_1+\cdots+a_nx_n=0
$$

定义。

用向量写：

$$
\mathbf a=
\begin{bmatrix}
a_0\\
a_1\\
\vdots\\
a_n
\end{bmatrix},
$$

那么：

$$
\boxed{
\mathbf a^{\mathsf T}\mathbf x=0
}
$$

就是射影超平面方程。

---

# 31. 这就是前面 $\mathbb P^2$ 中直线方程的推广

在：

$$
\mathbb P^2,
$$

射影超平面的维数是：

$$
2-1=1.
$$

一维射影子空间就是：

$$
\boxed{
\text{射影直线}
}
$$

所以：

$$
ax+by+cw=0
$$

既是：

$$
\mathbb P^2
$$

中的射影直线方程，也是：

$$
\mathbb P^2
$$

中的超平面方程。

这是因为在二维射影空间里：

$$
\boxed{
\text{直线就是超平面}
}
$$

---

# 32. 在 $\mathbb P^3$ 中超平面是什么？

$$
\mathbb P^3
$$

维数为：

$$
3.
$$

所以超平面维数为：

$$
2.
$$

也就是说：

$$
\boxed{
\mathbb P^3
\text{ 中的超平面是射影平面}
}
$$

方程形式：

$$
ax+by+cz+dw=0.
$$

例如：

$$
x+2y-z+3w=0.
$$

在仿射图：

$$
w=1
$$

中，它变成：

$$
X+2Y-Z+3=0.
$$

这就是普通三维仿射空间中的一个平面。

---

# 33. 再仔细区分三个“平面”

这里很容易语言打架。

在

$$
\mathbb R^3
$$

中：

$$
ax+by+cz=0
$$

是一个二维**线性平面**，且过原点。

在普通三维仿射空间中：

$$
aX+bY+cZ+d=0
$$

是一个二维**仿射平面**，一般不经过原点。

而在：

$$
\mathbb P^3
$$

中：

$$
ax+by+cz+dw=0
$$

是一个二维**射影平面**。

三者有关，但不是同一个对象。

---

# 35. 为什么射影子空间和线性子空间关系这么紧？

因为射影空间本身就是从线性空间：

$$
V\setminus\{0\}
$$

通过缩放等价关系：

$$
\mathbf v\sim\lambda\mathbf v
$$

构造出来的。

所以：

$$
W\subseteq V
$$

只要是线性子空间，

它里面的非零向量也天然可以取射影等价类。

于是：

$$
W
$$

自然产生：

$$
\mathbb P(W).
$$

所以：

$$
\boxed{
射影子空间本质上就是线性子空间“去掉整体尺度”后的结果
}
$$

---

# 36. 仿射子空间又是怎样藏在射影子空间中的？

这是另外一个非常漂亮的关系。

比如在：

$$
\mathbb P^2
$$

中取一条射影直线：

$$
ax+by+cw=0.
$$

在：

$$
w\neq0
$$

的仿射图中，除以 $w$：

$$
a\frac{x}{w}
+
b\frac{y}{w}
+
c
=

0.

$$

定义：

$$
X=\frac{x}{w},
\qquad
Y=\frac{y}{w}.
$$

得到：

$$
aX+bY+c=0.
$$

这就是普通仿射直线。

所以：

$$
\boxed{
射影子空间
\cap
\text{仿射图}
=

\text{仿射子空间}
}
$$

这是非常重要的结构关系。

---

# 37. 无穷远超平面重新出现了

在：

$$
\mathbb P^n
$$

里，我们通常选择最后一个齐次坐标：

$$
w.
$$

仿射区域定义为：

$$
w\neq0.
$$

而：

$$
w=0
$$

定义一个射影超平面。

因为它就是一次齐次方程：

$$
0x_1+\cdots+0x_n+1w=0.
$$

因此：

$$
\boxed{
H_\infty:
w=0
}
$$

是一个射影超平面。

它叫：

$$
\boxed{
\text{hyperplane at infinity}
}
$$

即：

$$
\boxed{
\text{无穷远超平面}
}
$$

---

# 38. 无穷远超平面的维数是多少？

$$
\mathbb P^n
$$

维数为：

$$
n.
$$

一个超平面维数：

$$
n-1.
$$

所以：

$$
H_\infty
\cong
\mathbb P^{n-1}.
$$

于是：

$$
\boxed{
\mathbb P^n
=

\mathbb R^n
\cup
\mathbb P^{n-1}_{\infty}
}
$$

这个公式现在应该比前面看起来更自然了。

不是说“硬塞进一个无穷远东西”。

而是：

> 选择一个射影超平面作为无穷远超平面后，它的补集就形成一个仿射空间。

---

# 39. 一个很重要的概念：余维数

设：

$$
W\subseteq V.
$$

定义：

$$
\boxed{
\operatorname{codim}W
=

\dim V-\dim W
}
$$

叫做：

$$
\boxed{
\text{codimension}
}
$$

中文：

$$
\boxed{
\text{余维数}
}
$$

例如在：

$$
\mathbb R^3
$$

中，一条直线维数是：

$$
1.
$$

所以余维数：

$$
3-1=2.
$$

一个平面维数：

$$
2.
$$

余维数：

$$
3-2=1.
$$

所以平面是超平面。

因为超平面的定义就是：

$$
\boxed{
\operatorname{codim}=1
}
$$

---

# 40. 为什么一个方程通常降低一个维度？

考虑：

$$
\mathbb R^{n+1}.
$$

一个非零线性方程：

$$
a_0x_0+\cdots+a_nx_n=0
$$

可以写成：

$$
\mathbf a^{\mathsf T}\mathbf x=0.
$$

这里线性映射：

$$
L:\mathbb R^{n+1}\to\mathbb R
$$

定义为：

$$
L(\mathbf x)=\mathbf a^{\mathsf T}\mathbf x.
$$

因为：

$$
\mathbf a\neq0,
$$

所以：

$$
\operatorname{rank}L=1.
$$

根据秩-零化度定理：

$$
\dim(\ker L)
+
\operatorname{rank}L
=

n+1.
$$

因此：

$$
\dim(\ker L)+1=n+1.
$$

所以：

$$
\dim(\ker L)=n.
$$

因此一个非零独立线性方程，把：

$$
n+1
$$

维空间限制成：

$$
n
$$

维线性子空间。

射影化以后：

$$
n\mapsto n-1.
$$

所以：

$$
a_0x_0+\cdots+a_nx_n=0
$$

在：

$$
\mathbb P^n
$$

里定义：

$$
n-1
$$

维射影子空间。

也就是超平面。

---

# 41. 两个独立线性方程会怎样？

假设在：

$$
\mathbb P^3
$$

中有：

$$
a_1x+b_1y+c_1z+d_1w=0,
$$

和：

$$
a_2x+b_2y+c_2z+d_2w=0.
$$

如果两方程线性独立，那么在底层：

$$
\mathbb R^4
$$

中，它们把维数从：

$$
4
$$

降低到：

$$
2.
$$

因为矩阵秩是：

$$
2.
$$

于是解空间维数：

$$
4-2=2.
$$

射影化以后：

$$
2-1=1.
$$

因此：

$$
\boxed{
\mathbb P^3
\text{ 中两个不同射影平面的交集通常是一条射影直线}
}
$$

这就是三维射影几何里：

$$
\boxed{
\text{两个平面交于一条线}
}
$$

的线性代数本质。

---

# 42. 三个独立平面呢？

仍然在：

$$
\mathbb P^3.
$$

三个独立线性方程对应一个秩为：

$$
3
$$

的线性系统。

底层：

$$
\mathbb R^4
$$

中的零空间维数：

$$
4-3=1.
$$

射影化：

$$
1-1=0.
$$

所以：

$$
\boxed{
三个独立射影平面通常交于一个射影点
}
$$

又一次：

$$
\text{几何相交}
$$

完全变成了：

$$
\text{零空间维数计算}.
$$

---

# 43. 一般交集的维数公式

这里可以再往前一步。

设：

$$
A,B
$$

是向量空间 $V$ 的两个线性子空间。

我们有维数公式：

$$
\boxed{
\dim(A+B)
=

\dim A+\dim B-\dim(A\cap B)
}
$$

所以：

$$
\dim(A\cap B)
=

\dim A+\dim B-\dim(A+B).
$$

因为：

$$
A+B\subseteq V,
$$

所以：

$$
\dim(A+B)\leq\dim V.
$$

因此：

$$
\dim(A\cap B)
\geq
\dim A+\dim B-\dim V.
$$

这是很多“为什么射影对象一定相交”的根本原因。

---

# 44. 用它解释 $\mathbb P^2$ 中两条直线一定相交

$$
\mathbb P^2
$$

的底层空间是：

$$
V=\mathbb R^3.
$$

两条射影直线对应两个二维线性子空间：

$$
A,B\subseteq\mathbb R^3.
$$

所以：

$$
\dim A=2,
$$

$$
\dim B=2.
$$

因此：

$$
\dim(A\cap B)
\geq
2+2-3.
$$

所以：

$$
\dim(A\cap B)\geq1.
$$

如果两条射影直线不同，那么：

$$
A\neq B,
$$

所以交集不可能是二维。

因此：

$$
\dim(A\cap B)=1.
$$

一个一维线性子空间射影化以后是：

$$
0
$$

维射影空间，也就是一个点。

所以：

$$
\boxed{
两条不同射影直线恰好交于一个射影点
}
$$

这比“叉积算出来一个点”更深一层。

---

# 45. 再解释 $\mathbb P^3$ 中两条直线为什么可能不相交

这是一个很好的对照。

在：

$$
\mathbb P^3
$$

中，一条射影直线仍然对应二维线性子空间。

但底层环境变成：

$$
\mathbb R^4.
$$

所以：

$$
\dim(A\cap B)
\geq
2+2-4.
$$

即：

$$
\dim(A\cap B)\geq0.
$$

这个下界允许：

$$
\dim(A\cap B)=0.
$$

而线性子空间的零维交集就是：

$$
A\cap B=\{\mathbf0\}.
$$

但是：

$$
\mathbf0
$$

不能代表射影点。

所以射影化以后：

$$
\mathbb P(A)\cap\mathbb P(B)
=

\varnothing.
$$

因此：

$$
\boxed{
\mathbb P^3
\text{ 中两条射影直线仍然可能不相交}
}
$$

这就是所谓：

$$
\boxed{
\text{skew lines}
}
$$

异面直线。

所以要非常注意：

$$
\boxed{
“任意两条射影直线都相交”
}
$$

只在：

$$
\mathbb P^2
$$

这种射影平面中成立。

不是所有：

$$
\mathbb P^n
$$

都成立。

---

# 46. 这也是“平行”和“异面”完全不同的原因

普通三维空间里，两条不相交直线有两种可能：

平行，或者异面。

平行直线在射影化之后：

$$
\boxed{
会在无穷远点相交
}
$$

所以“不相交”的平行情形被消除了。

但是异面直线没有共同方向，也没有共同有限点。

因此即使射影化：

$$
\boxed{
它们仍然不相交
}
$$

这是一个非常重要的区别。

---

# 47. 射影子空间的维数公式

现在可以总结一个非常核心的转换公式。

设：

$$
V
$$

是一个维数为：

$$
n+1
$$

的向量空间。

于是：

$$
\dim\mathbb P(V)=n.
$$

若：

$$
W\subseteq V
$$

且：

$$
\dim W=k+1,
$$

那么：

$$
\boxed{
\dim\mathbb P(W)=k
}
$$

因此：

$$
\boxed{
\text{射影维数}
=

\text{线性维数}-1
}
$$

这个式子以后要形成条件反射。

---

# 48. 现在把线性、仿射、射影三种子空间统一起来

我们可以这样看：

在线性几何中：

$$
W\subseteq\mathbb R^{n+1}
$$

是线性子空间。

它必须：

$$
\mathbf0\in W.
$$

在射影几何中：

$$
\mathbb P(W)
$$

把 $W$ 中所有穿过原点的方向压成射影点。

而选择某个仿射图，比如：

$$
w=1,
$$

以后：

$$
\mathbb P(W)\cap\{w=1\}
$$

就会变成普通仿射子空间。

所以有一条非常重要的链：

$$
\boxed{
\text{线性子空间}
\longrightarrow
\text{射影子空间}
\longrightarrow
\text{仿射子空间}
}
$$

更具体地说：

$$
W
\subseteq
\mathbb R^{n+1}
$$

先取射影化：

$$
\mathbb P(W),
$$

然后选择：

$$
w\neq0
$$

这张仿射图，再规范化：

$$
w=1,
$$

就得到一个仿射子空间。

---

# 49. 一个特别重要的二维例子

考虑仿射直线：

$$
Y=2X+3.
$$

写成：

$$
2X-Y+3=0.
$$

齐次化：

$$
2x-y+3w=0.
$$

这是：

$$
\mathbb R^3
$$

中的二维线性子空间：

$$
W
=

\left\{
(x,y,w):
2x-y+3w=0
\right\}.
$$

注意，它经过：

$$
(0,0,0).
$$

射影化：

$$
\mathbb P(W)
$$

是一条：

$$
\mathbb P^2
$$

中的射影直线。

然后取：

$$
w=1.
$$

得到：

$$
2X-Y+3=0.
$$

于是重新得到：

$$
Y=2X+3.
$$

所以整个过程是：

$$
\boxed{
\mathbb R^3
\text{ 中二维线性子空间}
}
$$

$$
\downarrow
$$

$$
\boxed{
\mathbb P^2
\text{ 中一维射影直线}
}
$$

$$
\downarrow\quad w=1
$$

$$
\boxed{
\mathbb R^2
\text{ 中一维仿射直线}
}
$$

这三者其实是同一个几何结构从三个不同层面观察的结果。

---

# 50. 最后把这一章真正的骨架压缩出来

这一章最关键的结论可以浓缩为下面这一组：

$$
\boxed{
F(\lambda\mathbf x)
=

\lambda^dF(\mathbf x)
}
$$

定义 $d$ 次齐次函数。

因为射影点满足：

$$
\mathbf x\sim\lambda\mathbf x,
$$

所以齐次方程：

$$
F(\mathbf x)=0
$$

能够良定义地描述射影对象。

而：

$$
\boxed{
\mathbb P(W)
=

(W\setminus\{0\})/\sim
}
$$

把线性子空间 $W$ 射影化。

若：

$$
\dim W=k+1,
$$

则：

$$
\boxed{
\dim\mathbb P(W)=k
}
$$

特别地：

$$
\boxed{
\text{点}
\leftrightarrow
1\text{维线性子空间}
}
$$

$$
\boxed{
\text{射影直线}
\leftrightarrow
2\text{维线性子空间}
}
$$

$$
\boxed{
\text{射影平面}
\leftrightarrow
3\text{维线性子空间}
}
$$

而在：

$$
\mathbb P^n
$$

中，超平面是：

$$
n-1
$$

维射影子空间，由一次齐次方程：

$$
\boxed{
a_0x_0+\cdots+a_nx_n=0
}
$$

定义。

最值得你现在形成的整体图景是：

$$
\boxed{
\begin{array}{c}
\mathbb R^{n+1}
\\[4pt]
\text{线性空间}
\\[4pt]
\downarrow\text{ 除掉整体尺度}
\\[4pt]
\mathbb P^n
\\[4pt]
\text{射影空间}
\\[4pt]
\downarrow\text{ 选择 }w\neq0,\text{ 规范化 }w=1
\\[4pt]
\mathbb R^n
\\[4pt]
\text{仿射空间}
\end{array}
}
$$

而“齐次”正是让这三个世界能够彼此兼容的语言。
