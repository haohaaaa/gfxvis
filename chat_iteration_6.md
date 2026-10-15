# 第六章：透视投影（Perspective Projection）、消失点与相机矩阵

这一章会把我们前面学习的射影几何真正应用到三维世界。

之前我们一直在研究：

$$ \mathbb P^n $$

中的点、直线、平面，以及射影变换。

现在要解决一个很具体的问题：

> 三维空间中的一个点，为什么能够通过一个 $3\times4$ 矩阵映射到二维图像？为什么最后还需要除以一个坐标？

我们将从最简单的针孔相机开始，逐步推导到：

$$ \boxed{ \mathbf p\sim P\mathbf X } $$

其中：

$$ P\in\mathbb R^{3\times4}. $$

然后继续理解：

- 透视投影为什么产生近大远小。
- 为什么三维平行线的图像可能相交。
- 消失点（Vanishing Point）到底是什么。
- 为什么一个三维平面能够产生二维 Homography。
- 为什么光栅化中的 Perspective-Correct Interpolation 必须插值 $1/Z$。

最后你会发现，这些看起来不同的现象，实际上都可以用一个统一结构解释：

$$ \boxed{ \text{高维线性运算} \longrightarrow \text{齐次归一化} \longrightarrow \text{分式关系} } $$

# 0. 先统一本章所有基本符号

为了避免不同教材中相机坐标系的正负号混淆，我们先使用一种简单的约定。

假设有一个理想针孔相机：

- 相机中心位于原点 $O=(0,0,0)$。
- 相机朝着 $+Z$ 方向观察。
- 三维点的相机坐标为 $(X,Y,Z)$。
- 可见点满足 $Z>0$。
- 在相机前方放置一个虚拟成像平面 $Z=f$。
- 焦距 $f>0$。

这里的成像平面是虚拟成像平面（virtual image plane），不是真实相机感光元件位于针孔后方的物理平面。

我们这样选择是为了避免图像倒置带来的负号。

三维点记作：

$$ Q=(X,Y,Z). $$

它投影到图像平面上的点记作：

$$ q=(u,v). $$

其中：

$$ u,v $$

是成像平面上的二维坐标。

本章暂时采用：

$$ Z>0 $$

表示相机前方。

以后进入 OpenGL、Vulkan 等图形 API 时，我们再讨论坐标约定差异。

# 1. 为什么我们会看到近大远小？

我们先不使用齐次坐标，也不使用矩阵。

只考虑最简单的物理几何。

想象相机中心是一个小孔。

物体发出的光线经过这个小孔，在成像平面上形成图像。

针孔投影的侧视图

示意图：两个点具有相同高度，但深度不同。离相机更近的点，其投影距离光轴更远。图中的距离不作为数值测量。

现在我们问：

对于三维点 $(X,Y,Z)$，它会落在图像平面上的哪里？

这个问题可以通过相似三角形精确解决。

# 2. 从相似三角形推导透视投影

我们只看 $XZ$ 平面。

三维点为：

$$ Q=(X,0,Z). $$

相机中心是：

$$ O=(0,0,0). $$

图像平面满足：

$$ Z=f. $$

我们需要求从 $O$ 指向 $Q$ 的直线和成像平面的交点。

## 第一步：写出经过相机中心的直线

经过：

$$ O=(0,0,0) $$

和：

$$ Q=(X,0,Z) $$

的直线可以参数化为：

$$ L(t)=O+t(Q-O). $$

因为：

$$ O=\mathbf0, $$

所以：

$$ L(t)=tQ. $$

展开：

$$ L(t)=(tX,0,tZ). $$

这里 $t\in\mathbb R$ 是直线参数。

## 第二步：要求交点位于成像平面

成像平面方程为：

$$ Z\_{\text{image}}=f. $$

因此交点需要满足：

$$ tZ=f. $$

由于可见点满足：

$$ Z>0, $$

所以：

$$ t=\frac fZ. $$

## 第三步：求图像横坐标

交点的横坐标：

$$ u=tX. $$

代入：

$$ t=\frac fZ. $$

得到：

$$ \boxed{ u=f\frac XZ } $$

同理，在 $YZ$ 平面中：

$$ \boxed{ v=f\frac YZ } $$

于是我们得到透视投影的基本方程：

$$ \boxed{ \begin{aligned} u&=f\frac XZ,\\[4pt] v&=f\frac YZ. \end{aligned} } $$

这就是理想针孔相机最核心的投影公式。

注意：我们没有使用任何复杂的射影几何定理，只使用了经过原点的直线与平面的求交。

# 3. 为什么这个公式自然产生近大远小？

现在看：

$$ u=f\frac XZ. $$

假设：

$$ f=2. $$

我们取两个三维点：

$$ Q_1=(2,0,4), $$

$$ Q_2=(2,0,8). $$

它们具有相同的：

$$ X=2, $$

但深度不同。

第一个点：

$$ u_1 = 2\cdot\frac24 = 1. $$

第二个点：

$$ u_2 = 2\cdot\frac28 = \frac12. $$

所以：

$$ \boxed{ u_1=1,\qquad u_2=0.5 } $$

第二个点距离相机更远，图像中的横向偏移更小。

更一般地，假设一段与成像平面平行的线段具有真实长度 $L$，且整段线段的深度均为 $Z$。

那么它投影后的长度为：

$$ \boxed{ \ell=\frac{fL}{Z} } $$

这里：

- $L$：线段在三维空间中的真实长度；
- $\ell$：投影到虚拟成像平面后的长度；
- $f$：焦距；
- $Z$：线段深度。

如果距离加倍：

$$ Z\mapsto2Z, $$

那么：

$$ \ell\mapsto\frac{\ell}{2}. $$

因此：

$$ \boxed{ \text{近大远小来自投影尺度中的 }\frac1Z } $$

这个 $1/Z$ 后面还会出现在 perspective-correct interpolation 中。

# 4. 这里有一个容易忽略的问题：透视投影不是仿射变换

我们已经知道仿射变换具有：

$$ \mathbf y=A\mathbf x+\mathbf b $$

的形式。

但现在：

$$ u=f\frac XZ, \qquad v=f\frac YZ. $$

这里出现除法：

$$ \frac XZ,\qquad\frac YZ. $$

所以作为普通实数坐标上的映射，它不是一般的仿射变换。

如果我们把投影记作：

$$ \pi(X,Y,Z) = \left( f\frac XZ, f\frac YZ \right), $$

那么它包含一个位置相关的分母。

这正是我们之前研究过的分式关系。

但现在会发生一件很漂亮的事：

这个看起来非线性的投影，可以通过齐次坐标写成一个矩阵乘法。

# 5. 三维点的齐次坐标

一个普通三维仿射点：

$$ Q=(X,Y,Z) $$

可以嵌入射影空间：

$$ \mathbb P^3. $$

它对应齐次点：

$$ \boxed{ \mathbf Q= \begin{bmatrix} X\\Y\\Z\\1 \end{bmatrix} } $$

因为我们选择了：

$$ W=1 $$

作为有限点的标准代表。

更一般地，同一个射影点可以写成：

$$ [X:Y:Z:W]. $$

如果：

$$ W\neq0, $$

则普通三维坐标为：

$$ \left( \frac XW, \frac YW, \frac ZW \right). $$

如果：

$$ W=0, $$

则是三维射影空间中所选仿射图的无穷远点。

注意这里一共有四个齐次分量。

这正好对应我们之前学过的：

$$ \boxed{ \mathbb P^3 \text{ 来自 } \mathbb R^4 } $$

# 6. 图像点的齐次坐标

相机产生的图像是二维的。

所以图像点属于：

$$ \mathbb P^2. $$

用齐次坐标表示：

$$ \boxed{ \mathbf q= \begin{bmatrix} x\\y\\w \end{bmatrix} } $$

其中：

$$ [x:y:w] = [\lambda x:\lambda y:\lambda w], \qquad \lambda\neq0. $$

如果：

$$ w\neq0, $$

那么普通图像坐标：

$$ u=\frac xw, $$

$$ v=\frac yw. $$

请特别注意：

这里的三维射影点有四个齐次分量：

$$ [X:Y:Z:W], $$

而图像射影点有三个：

$$ [x:y:w]. $$

大写 $W$ 和小写 $w$ 分别属于不同空间，不能混为一谈。

# 7. 把透视投影写成矩阵

我们现在希望找到一个矩阵 $P$，使：

$$ \mathbf q\sim P\mathbf Q. $$

其中：

$$ \mathbf Q= \begin{bmatrix} X\\Y\\Z\\1 \end{bmatrix}. $$

回忆透视投影：

$$ u=f\frac XZ, \qquad v=f\frac YZ. $$

我们希望得到齐次图像点：

$$ \begin{bmatrix} fX\\ fY\\ Z \end{bmatrix}. $$

因为做齐次除法以后：

$$ \frac{fX}{Z}=u, $$

$$ \frac{fY}{Z}=v. $$

因此可以选择矩阵：

$$ \boxed{ P= \begin{bmatrix} f&0&0&0\\ 0&f&0&0\\ 0&0&1&0 \end{bmatrix} } $$

验证：

$$ P\mathbf Q = \begin{bmatrix} f&0&0&0\\ 0&f&0&0\\ 0&0&1&0 \end{bmatrix} \begin{bmatrix} X\\Y\\Z\\1 \end{bmatrix}. $$

逐行计算：

$$ x=fX, $$

$$ y=fY, $$

$$ w=Z. $$

因此：

$$ P\mathbf Q = \begin{bmatrix} fX\\fY\\Z \end{bmatrix}. $$

最后齐次归一化：

$$ u=\frac xw=f\frac XZ, $$

$$ v=\frac yw=f\frac YZ. $$

完全符合前面的几何推导。

所以：

$$ \boxed{ \mathbf q\sim P\mathbf Q } $$

就是针孔相机的齐次投影形式。

# 8. 为什么相机矩阵是 $3\times4$，而 Homography 是 $3\times3$？

这是一个非常重要的区别。

我们先比较：

| 几何映射        | 矩阵尺寸   | 映射关系                                |
| --------------- | ---------- | --------------------------------------- |
| 二维 Homography | $3\times3$ | $\mathbb P^2\to\mathbb P^2$             |
| 三维射影自同构  | $4\times4$ | $\mathbb P^3\to\mathbb P^3$             |
| 针孔相机投影    | $3\times4$ | $\mathbb P^3\dashrightarrow\mathbb P^2$ |

第三行的虚线箭头表示，这个射影映射在某个点上没有定义。我们马上解释。

## 为什么 Homography 可以逆，而相机投影不能直接逆？

二维 Homography：

$$ \mathbf q'\sim H\mathbf q $$

其中：

$$ H\in GL(3,\mathbb R). $$

因此 $H$ 是可逆方阵。

它把二维射影空间中的点映射到另一个二维射影空间中的点。

但针孔相机：

$$ \mathbf q\sim P\mathbf Q $$

使用：

$$ P\in\mathbb R^{3\times4}. $$

它不是方阵。

而且相机投影具有一个本质特征：

$$ \boxed{ \text{许多不同的三维点，可以投影到同一个二维点} } $$

因此投影不是一一对应的。

我们来看具体例子。

# 9. 为什么一个图像点无法唯一确定三维点？

为了简化，选择：

$$ f=1. $$

因此：

$$ u=\frac XZ, \qquad v=\frac YZ. $$

考虑三维点：

$$ Q_1=(1,2,1). $$

它的投影：

$$ u_1=\frac11=1, $$

$$ v_1=\frac21=2. $$

所以图像点为：

$$ q_1=(1,2). $$

再考虑：

$$ Q_2=(2,4,2). $$

它的投影：

$$ u_2=\frac22=1, $$

$$ v_2=\frac42=2. $$

所以：

$$ q_2=(1,2). $$

再考虑：

$$ Q_3=(10,20,10). $$

同样：

$$ u_3=1, \qquad v_3=2. $$

因此：

$$ \boxed{ \pi(Q_1)=\pi(Q_2)=\pi(Q_3) } $$

但：

$$ Q_1\neq Q_2\neq Q_3. $$

这些三维点都位于从相机中心出发的同一条直线上。

实际上，对任意：

$$ t>0, $$

点：

$$ Q(t)=(t,2t,t) $$

都投影到：

$$ (1,2). $$

因此单个图像点通常只能确定一条三维射线，而不能确定具体深度。

# 10. 用齐次坐标理解这个深度歧义

刚才三个三维点对应：

$$ [1:2:1:1], $$

$$ [2:4:2:1], $$

$$ [10:20:10:1]. $$

请注意：

它们不是同一个 $\mathbb P^3$ 射影点。

为什么？

因为最后一个齐次分量都是 $1$。

例如：

$$ [1:2:1:1] \neq [2:4:2:1]. $$

如果两个齐次向量成比例，那么前三个分量缩放两倍时，最后一个分量也必须从 $1$ 变成 $2$。

但这里没有。

所以它们是不同的三维射影点。

只是经过相机矩阵：

$$ P= \begin{bmatrix} 1&0&0&0\\ 0&1&0&0\\ 0&0&1&0 \end{bmatrix} $$

以后：

$$ P \begin{bmatrix} 1\\2\\1\\1 \end{bmatrix} = \begin{bmatrix} 1\\2\\1 \end{bmatrix}, $$

而：

$$ P \begin{bmatrix} 2\\4\\2\\1 \end{bmatrix} = \begin{bmatrix} 2\\4\\2 \end{bmatrix}. $$

这两个输出齐次向量成比例：

$$ [1:2:1]=[2:4:2]. $$

所以：

$$ \boxed{ \text{不同三维射影点可以对应同一个二维射影点} } $$

这就是相机投影和可逆 Homography 的根本区别。

# 11. 更深一层：相机中心是投影矩阵的零空间

现在我们回到线性代数。

对于标准相机：

$$ P= \begin{bmatrix} f&0&0&0\\ 0&f&0&0\\ 0&0&1&0 \end{bmatrix}. $$

考虑齐次向量：

$$ \mathbf C= \begin{bmatrix} 0\\0\\0\\1 \end{bmatrix}. $$

计算：

$$ P\mathbf C = \begin{bmatrix} 0\\0\\0 \end{bmatrix}. $$

所以：

$$ \boxed{ P\mathbf C=\mathbf0 } $$

但：

$$ [\mathbf0] $$

不是合法的二维射影点。

因此针孔相机投影在相机中心本身没有定义。

为什么？

因为从相机中心向相机中心连线，没有唯一的观察方向。

这在几何上完全合理。

## 相机中心与零空间的关系

标准相机矩阵有：

$$ \operatorname{rank}P=3. $$

因为 $P$ 有四列，根据秩-零化度定理：

$$ \dim\ker P = 4-\operatorname{rank}P. $$

于是：

$$ \dim\ker P=4-3=1. $$

所以：

$$ \ker P = \operatorname{span}(\mathbf C). $$

射影化以后，它对应一个：

$$ \mathbb P^3 $$

中的点。

这个点就是：

$$ \boxed{ \text{Camera Center（相机中心）} } $$

因此我们得到一个很有意思的事实：

$$ \boxed{ \text{相机中心可以由相机矩阵的零空间求出} } $$

这在计算机视觉里非常重要。

更一般地，对于满行秩的 $3\times4$ 相机矩阵 $P$，相机中心的齐次坐标就是非零解：

$$ \boxed{ P\mathbf C=\mathbf0 } $$

所确定的射影点。

# 12. 相机投影到底把什么对象映射成什么？

现在可以从射影几何角度描述整个针孔相机。

三维世界中的点：

$$ Q\in\mathbb P^3. $$

图像中的点：

$$ q\in\mathbb P^2. $$

相机投影是：

$$ \pi_P:\mathbb P^3\setminus\{C\}\to\mathbb P^2, $$

其中：

$$ \boxed{ \pi_P([\mathbf Q])=[P\mathbf Q] } $$

而 $C$ 是相机中心。

那么，对于固定的图像点：

$$ q, $$

它的所有可能三维原像是什么？

在非退化相机下，这些原像构成一条穿过相机中心的射影直线，去掉相机中心本身。

在普通三维空间中，只考虑相机前方时，这就对应一条观察射线。

所以：

$$ \boxed{ \text{图像点} \longleftrightarrow \text{穿过相机中心的一条观察方向} } $$

注意这是相机投影建立的对应，不是说三维射影点本身就是一条观察射线。

这两件事情需要区分。

# 13. 从标准相机推广到任意位置、任意朝向的相机

前面我们假设相机：

- 位于世界原点；
- 朝向 $+Z$；
- 没有旋转；
- 成像坐标原点位于光轴中心。

真实相机当然不一定满足这些条件。

因此，我们需要把世界坐标转换到相机坐标。

## 13.1 世界坐标与相机坐标

设一个三维点的世界坐标为：

$$ \mathbf X_w= \begin{bmatrix} X_w\\Y_w\\Z_w \end{bmatrix}. $$

对应的相机坐标记作：

$$ \mathbf X_c= \begin{bmatrix} X_c\\Y_c\\Z_c \end{bmatrix}. $$

这里下标：

- $w$：world，世界坐标系；
- $c$：camera，相机坐标系。

假设相机坐标相对于世界坐标通过旋转和平移确定。

那么：

$$ \boxed{ \mathbf X_c=R\mathbf X_w+\mathbf t } $$

其中：

$$ R\in SO(3) $$

是一个 $3\times3$ 旋转矩阵，而：

$$ \mathbf t\in\mathbb R^3 $$

是平移项。

注意我们约定 $R,\mathbf t$ 是把世界坐标变换到相机坐标的参数。

这不是直接表示相机在世界中的位置和朝向。

## 13.2 相机中心与平移向量的关系

设相机中心的世界坐标为：

$$ \mathbf C_w. $$

由于相机中心在相机坐标系中是原点：

$$ \mathbf X_c=\mathbf0. $$

所以：

$$ \mathbf0=R\mathbf C_w+\mathbf t. $$

移项：

$$ \mathbf t=-R\mathbf C_w. $$

因此：

$$ \boxed{ \mathbf X_c = R(\mathbf X_w-\mathbf C_w) } $$

这个表达更容易从几何上理解：

1. 先减去相机中心，得到相机指向三维点的向量；
2. 再通过 $R$ 把它转换到相机的坐标轴下。

# 14. 用齐次矩阵表示相机外参

三维点的世界齐次坐标：

$$ \widetilde{\mathbf X}\_w = \begin{bmatrix} X_w\\Y_w\\Z_w\\1 \end{bmatrix}. $$

我们希望得到：

$$ \mathbf X_c=R\mathbf X_w+\mathbf t. $$

所以：

$$ \boxed{ \mathbf X_c = \begin{bmatrix} R&\mathbf t \end{bmatrix} \widetilde{\mathbf X}\_w } $$

这里：

$$ [R\mid\mathbf t] $$

是一个 $3\times4$ 矩阵。

如果还想保留相机坐标的第四个齐次分量，可以使用 $4\times4$ 矩阵：

$$ \boxed{ \begin{bmatrix} \mathbf X_c\\1 \end{bmatrix} = \begin{bmatrix} R&\mathbf t\\ \mathbf0^{\mathsf T}&1 \end{bmatrix} \begin{bmatrix} \mathbf X_w\\1 \end{bmatrix} } $$

其中：

$$ \mathbf0^{\mathsf T} = \begin{bmatrix} 0&0&0 \end{bmatrix}. $$

矩阵：

$$ E= \begin{bmatrix} R&\mathbf t\\ \mathbf0^{\mathsf T}&1 \end{bmatrix} $$

经常称为世界到相机的外参变换矩阵。

外参（Extrinsics）描述的是：

$$ \boxed{ \text{相机相对于世界坐标系的位置和朝向} } $$

# 15. 相机内参（Intrinsics）是什么？

前面我们使用：

$$ u=f\frac{X_c}{Z_c}, \qquad v=f\frac{Y_c}{Z_c}. $$

这里假设焦距直接以成像平面所使用的长度单位表示。

但真实数字图像通常使用像素坐标。

例如像素位置：

$$ (320,240). $$

这就要求我们从理想成像坐标转换为像素坐标。

我们先使用最常见的简化模型：

$$ u=f_x\frac{X_c}{Z_c}+c_x, $$

$$ v=f_y\frac{Y_c}{Z_c}+c_y. $$

其中：

- $f_x$：以水平像素为单位的有效焦距；
- $f_y$：以垂直像素为单位的有效焦距；
- $c_x$：主点（principal point）的水平像素坐标；
- $c_y$：主点的垂直像素坐标。

这里我们已经约定相机坐标轴与图像坐标轴的方向相容。如果图像像素的 $v$ 轴向下，需要在坐标系定义中一致地处理方向。

## 把这两个方程写成矩阵

观察：

$$ u= \frac{f_xX_c+c_xZ_c}{Z_c}, $$

$$ v= \frac{f_yY_c+c_yZ_c}{Z_c}. $$

因此我们希望得到齐次图像坐标：

$$ \begin{bmatrix} f_xX_c+c_xZ_c\\ f_yY_c+c_yZ_c\\ Z_c \end{bmatrix}. $$

定义：

$$ \boxed{ K= \begin{bmatrix} f_x&0&c_x\\ 0&f_y&c_y\\ 0&0&1 \end{bmatrix} } $$

那么：

$$ K\mathbf X_c = \begin{bmatrix} f_xX_c+c_xZ_c\\ f_yY_c+c_yZ_c\\ Z_c \end{bmatrix}. $$

做齐次除法，就得到像素坐标。

这个 $K$ 就叫：

$$ \boxed{ \text{Camera Intrinsic Matrix} } $$

即相机内参矩阵。

如果考虑图像坐标轴之间的 skew（斜交）参数 $s$，还可以写成：

$$ K= \begin{bmatrix} f_x&s&c_x\\ 0&f_y&c_y\\ 0&0&1 \end{bmatrix}. $$

我们后面的例子先取：

$$ s=0. $$

# 16. 终于得到完整的针孔相机矩阵

现在把两个步骤合并起来。

第一步：世界坐标转相机坐标。

$$ \mathbf X_c = [R\mid\mathbf t]\widetilde{\mathbf X}\_w. $$

第二步：相机坐标转齐次图像坐标。

$$ \mathbf q \sim K\mathbf X_c. $$

把第一步代入第二步：

$$ \mathbf q \sim K[R\mid\mathbf t]\widetilde{\mathbf X}\_w. $$

因此：

$$ \boxed{ \mathbf q \sim P\widetilde{\mathbf X}\_w } $$

其中：

$$ \boxed{ P=K[R\mid\mathbf t] } $$

这就是经典的针孔相机投影模型。

你以后在计算机视觉中会非常频繁地看到这个公式。

它可以理解成：

$$ \boxed{ \text{世界点} \xrightarrow{[R\mid\mathbf t]} \text{相机坐标} \xrightarrow{K} \text{齐次图像坐标} \xrightarrow{\div w} \text{像素坐标} } $$

## 一个具体数值例子

假设相机没有旋转和平移：

$$ R=I, \qquad \mathbf t=\mathbf0. $$

内参为：

$$ K= \begin{bmatrix} 800&0&320\\ 0&800&240\\ 0&0&1 \end{bmatrix}. $$

取相机坐标点：

$$ \mathbf X_c= \begin{bmatrix} 1\\0.5\\2 \end{bmatrix}. $$

计算：

$$ K\mathbf X_c = \begin{bmatrix} 800\cdot1+320\cdot2\\ 800\cdot0.5+240\cdot2\\ 2 \end{bmatrix}. $$

得到：

$$ = \begin{bmatrix} 1440\\880\\2 \end{bmatrix}. $$

因此像素坐标：

$$ u=\frac{1440}{2}=720, $$

$$ v=\frac{880}{2}=440. $$

所以：

$$ \boxed{ (u,v)=(720,440) } $$

这就是实际计算机视觉程序中使用相机矩阵投影点的基本过程。

# 17. 为什么三维直线投影后通常仍然是直线？

这是理解消失点之前必须弄清楚的问题。

我们此前已经知道：

射影自同构保持直线。

但针孔相机不是射影自同构，而是：

$$ \mathbb P^3\dashrightarrow\mathbb P^2. $$

那么它还会把直线映射成直线吗？

答案是：

一条不经过相机中心的三维射影直线，会投影成一条二维射影直线。

我们证明一下。

## 17.1 三维直线的参数方程

设三维直线上一点为：

$$ \mathbf A\in\mathbb R^3. $$

直线方向向量：

$$ \mathbf D\in\mathbb R^3, \qquad \mathbf D\neq\mathbf0. $$

那么直线可以写成：

$$ \mathbf X(t)=\mathbf A+t\mathbf D. $$

对应齐次向量：

$$ \widetilde{\mathbf X}(t) = \begin{bmatrix} \mathbf A+t\mathbf D\\ 1 \end{bmatrix}. $$

我们把它拆成：

$$ \widetilde{\mathbf X}(t) = \begin{bmatrix} \mathbf A\\1 \end{bmatrix} + t \begin{bmatrix} \mathbf D\\0 \end{bmatrix}. $$

注意第二个向量：

$$ \begin{bmatrix} \mathbf D\\0 \end{bmatrix} $$

最后一个齐次分量是 $0$。

它正好代表这条三维直线的无穷远方向。

## 17.2 作用相机矩阵

齐次图像向量：

$$ \widetilde{\mathbf q}(t) = P\widetilde{\mathbf X}(t). $$

代入：

$$ \widetilde{\mathbf q}(t) = P \begin{bmatrix} \mathbf A\\1 \end{bmatrix} + tP \begin{bmatrix} \mathbf D\\0 \end{bmatrix}. $$

定义：

$$ \mathbf a = P \begin{bmatrix} \mathbf A\\1 \end{bmatrix}, $$

$$ \mathbf d = P \begin{bmatrix} \mathbf D\\0 \end{bmatrix}. $$

于是：

$$ \boxed{ \widetilde{\mathbf q}(t)=\mathbf a+t\mathbf d } $$

这意味着所有投影后的齐次向量都位于：

$$ \operatorname{span}(\mathbf a,\mathbf d). $$

如果 $\mathbf a,\mathbf d$ 线性无关，那么这个 span 是一个二维线性子空间。

而我们第三章已经知道：

$$ \boxed{ \mathbb R^3\text{ 中的二维线性子空间} \leftrightarrow \mathbb P^2\text{ 中的一条射影直线} } $$

因此：

$$ \boxed{ \text{三维直线的投影仍然是二维直线} } $$

这里需要排除经过相机中心的直线。

如果原始三维直线经过相机中心，那么整条线上的其他点都沿着同一观察方向，最终会投影成一个图像点，而不是一条图像直线。

这个特殊情况也很符合几何直觉。

# 18. 什么是消失点（Vanishing Point）？

现在进入本章最漂亮的概念之一。

你应该见过这样的现象：

- 两条铁轨在真实世界中平行；
- 但在照片中，它们看起来越来越靠近；
- 最后似乎在远方某个点汇合。

那个点叫：

$$ \boxed{ \text{Vanishing Point} } $$

即消失点或灭点。

[The Long Walk](https://images.openai.com/static-rsc-4/CrHlD7Q2n-qd8L-_5G_GysV09n6rqP_NiiDESZ8QyPE_3pllOnaoydSuwOVOpb8OynCtLQLpWjyhUgQ-fkIfQqqU91PVEU5cRhn8fNnqzDb34DHx8IigVrNbqgH_Ji59jV8clPJxS4d-i_4sQ0CnzfGQj0QggM-GLSG5AFQJpJLEQK8_eUtvPBzkp00wtf_8?purpose=inline)

[Straight Road Pictures | Download Free Images on Unsplash](https://images.openai.com/static-rsc-4/SNdvka6h8wpNkLMgw7zov7pRReReWbbnvsPoxnFkj7XBgCHyGTngCf_8VUIvbSer_Gv0Vm6ag21-YQFMx14Icx3Dfvs0SN-BSi1zoNvBlPKQYaXI6sTUi7JzX1DqS9yZzcc6QNCt74VJu9a6mKC4D98dRSICgH5BRsgh4m3IY9E?purpose=inline)

[Railroad Track](https://images.openai.com/static-rsc-4/SiUVX8DyC6Orwt0YlutmOEfKlKdswZ40DUgB2J1YCggMZ4XZ0yzOKFGHxkcc7Xx522KnI1LijhgOC9v_D2ovYL9MiTC2tCcwWHcSPQHqeHu5nnlk4suvvbghhWPQTm2cQ_afq9CDg-mPG6V98xNzjQnL1ZyMBj7k7QP6TF6yg28af86pHSh7T3ypOzsxhith?purpose=inline)

8

我们前面已经学过：

> 平行直线在射影空间中共享一个无穷远点。

现在我们将证明：

$$ \boxed{ \text{消失点就是三维无穷远方向经过相机投影得到的图像点} } $$

这不是一种比喻，而是严格的射影几何结论。

# 19. 从三维平行线严格推导消失点

设一族三维平行线具有共同方向：

$$ \mathbf D= \begin{bmatrix} D_X\\D_Y\\D_Z \end{bmatrix}, \qquad \mathbf D\neq\mathbf0. $$

不同直线可以写成：

$$ \mathbf X_i(t)=\mathbf A_i+t\mathbf D. $$

这里：

- $i$：第 $i$ 条直线；
- $\mathbf A_i$：每条直线上的一个固定点；
- $\mathbf D$：所有直线共同的方向；
- $t$：沿直线移动的参数。

暂时假设相机位于原点，且无旋转。

对应齐次图像向量：

$$ \widetilde{\mathbf q}\_i(t) = K(\mathbf A_i+t\mathbf D). $$

利用线性性：

$$ \widetilde{\mathbf q}\_i(t) = K\mathbf A_i+tK\mathbf D. $$

由于齐次坐标允许整体非零缩放，我们可以在 $t\neq0$ 时写成：

$$ [\widetilde{\mathbf q}\_i(t)] = \left[ \frac1tK\mathbf A_i+K\mathbf D \right]. $$

当：

$$ t\to+\infty, $$

就有：

$$ \frac1tK\mathbf A_i\to\mathbf0. $$

所以射影极限为：

$$ \boxed{ \mathbf q\_\infty\sim K\mathbf D } $$

注意右侧完全不包含：

$$ \mathbf A_i. $$

所以无论这些平行线从哪里出发，只要它们有相同的方向：

$$ \mathbf D, $$

它们就具有同一个消失点：

$$ \boxed{ \mathbf q\_\infty\sim K\mathbf D } $$

这就是消失点的数学来源。

# 20. 为什么方向的无穷远点会投影到有限位置？

为了看清楚，我们考虑：

$$ K= \begin{bmatrix} f&0&0\\ 0&f&0\\ 0&0&1 \end{bmatrix}. $$

因此：

$$ \mathbf q\_\infty \sim K\mathbf D. $$

展开：

$$ \mathbf q\_\infty \sim \begin{bmatrix} fD_X\\ fD_Y\\ D_Z \end{bmatrix}. $$

如果：

$$ D_Z\neq0, $$

那么可以齐次归一化：

$$ u\_\infty = f\frac{D_X}{D_Z}, $$

$$ v\_\infty = f\frac{D_Y}{D_Z}. $$

所以：

$$ \boxed{ (u\_\infty,v\_\infty) = \left( f\frac{D_X}{D_Z}, f\frac{D_Y}{D_Z} \right) } $$

是有限的图像坐标。

这看起来可能有些反直觉：

> 三维空间中的无穷远点，怎么会变成二维图像中的有限点？

原因是：

“无穷远”依赖于你选择的仿射图。

我们前面已经学过，这不是射影点的绝对性质。

三维的无穷远超平面：

$$ W=0 $$

经过相机投影以后，完全可以映射到图像平面中的普通有限点。

因此：

$$ \boxed{ \text{三维无穷远} \not\Rightarrow \text{图像无穷远} } $$

# 21. 一个完整的消失点例子

假设：

$$ f=1. $$

两条三维直线分别为：

$$ L_1(t)=(t,0,1+t), $$

$$ L_2(t)=(t,1,1+t). $$

其中：

$$ t\geq0. $$

首先看它们的方向向量。

对两条直线，都有：

$$ \mathbf D=(1,0,1). $$

因此它们在三维空间中平行。

我们现在分别投影。

## 第一条直线

三维点为：

$$ (X,Y,Z)=(t,0,1+t). $$

投影公式：

$$ u=\frac XZ, \qquad v=\frac YZ. $$

于是：

$$ u_1(t)=\frac{t}{1+t}, $$

$$ v_1(t)=0. $$

所以图像中的第一条线满足：

$$ v=0. $$

## 第二条直线

三维点为：

$$ (X,Y,Z)=(t,1,1+t). $$

投影得到：

$$ u_2(t)=\frac{t}{1+t}, $$

$$ v_2(t)=\frac1{1+t}. $$

注意：

$$ u_2(t)+v_2(t) = \frac{t}{1+t} + \frac1{1+t}. $$

所以：

$$ u_2(t)+v_2(t)=1. $$

因此第二条图像直线为：

$$ u+v=1. $$

现在求两条图像直线的交点。

第一条：

$$ v=0. $$

第二条：

$$ u+v=1. $$

代入：

$$ u+0=1. $$

所以：

$$ \boxed{ (u,v)=(1,0) } $$

这就是消失点。

现在直接用方向公式验证：

$$ \mathbf D=(1,0,1). $$

由于 $f=1$：

$$ u\_\infty=\frac11=1, $$

$$ v\_\infty=\frac01=0. $$

所以：

$$ \boxed{ \mathbf q\_\infty=(1,0) } $$

完全相同。

你会发现：

我们甚至不需要知道这些直线上任何一个具体点，只要知道方向，就能直接求消失点。

# 22. 所有三维平行线都一定产生有限消失点吗？

不一定。

这是一个很容易被忽略的重要细节。

假设方向向量满足：

$$ D_Z=0. $$

例如：

$$ \mathbf D=(1,0,0). $$

那么齐次消失点是：

$$ \mathbf q\_\infty \sim \begin{bmatrix} f\\0\\0 \end{bmatrix}. $$

也就是：

$$ \boxed{ [1:0:0] } $$

注意最后一个齐次分量是：

$$ w=0. $$

所以它是图像中的无穷远点。

这意味着该方向对应的图像直线仍然是平行的。

因此：

$$ \boxed{ \begin{aligned} D_Z\neq0 &\Rightarrow \text{通常有有限消失点},\\ D_Z=0 &\Rightarrow \text{消失点位于图像无穷远直线}. \end{aligned} } $$

这里我们使用的是相机朝向 $+Z$ 的标准坐标系。

更一般地，如果相机发生旋转：

$$ \mathbf D_c=R\mathbf D_w, $$

那么应该考察的是相机坐标下的：

$$ (D_c)\_Z. $$

此时：

$$ \boxed{ \mathbf q\_\infty \sim KR\mathbf D_w } $$

这个公式非常实用。

# 23. 消失点与我们前面学过的射影直线是什么关系？

现在可以把第六章和第二、第三章彻底连接起来。

在三维射影空间：

$$ \mathbb P^3 $$

中，考虑一个方向：

$$ \mathbf D= \begin{bmatrix} D_X\\D_Y\\D_Z \end{bmatrix}. $$

这个方向对应的三维无穷远点是：

$$ \boxed{ Q\_\infty= [D_X:D_Y:D_Z:0] } $$

因为最后一个齐次分量：

$$ W=0. $$

现在使用相机矩阵：

$$ P=K[I\mid\mathbf0]. $$

得到：

$$ P \begin{bmatrix} D_X\\D_Y\\D_Z\\0 \end{bmatrix} = K \begin{bmatrix} D_X\\D_Y\\D_Z \end{bmatrix}. $$

因此：

$$ \boxed{ q\_\infty = \pi_P(Q\_\infty) } $$

即：

$$ \boxed{ \text{消失点} = \text{三维无穷远点的相机投影} } $$

这就是它最本质的射影几何定义。

我们还可以继续推导：

如果三维平行线共享：

$$ Q\_\infty, $$

那么投影以后三条、四条甚至更多图像直线都会经过：

$$ q\_\infty. $$

因为相机投影保持点与线的关联关系，只要相应直线不经过相机中心并退化成点。

所以三维平行线对应的图像直线具有共点性。

这恰好把我们前面讲过的两件事连接起来：

$$ \boxed{ \text{三维平行性} \longrightarrow \text{共享三维无穷远点} \longrightarrow \text{图像共点性} } $$

# 24. 为什么同一个三维平面能够产生二维 Homography？

现在进入本章第二个重要主题。

我们已经知道：

三维世界到二维图像，一般由：

$$ \boxed{ P\in\mathbb R^{3\times4} } $$

描述。

但是在计算机视觉中，我们经常看到：

$$ \boxed{ H\in\mathbb R^{3\times3} } $$

也就是 Homography。

例如：

- 把一张倾斜拍摄的纸张矫正成正面视图；
- 把两张照片中的同一个平面区域对齐；
- 将一块倾斜的广告牌映射到正面矩形。

为什么原本需要 $3\times4$ 的投影，现在突然可以使用 $3\times3$ 矩阵？

关键是：

$$ \boxed{ \text{我们把三维点限制在同一个二维平面上了} } $$

二维平面本身只有两个自由度。

因此我们可以给它建立二维射影坐标，然后在两个二维射影空间之间构造 Homography。

我们先看最简单的例子。

# 25. 一个固定深度的三维平面

仍然使用相机中心位于原点、朝向 $+Z$ 的标准相机。

设：

$$ f>0. $$

考虑三维空间中的平面：

$$ \boxed{ Z=z_0 } $$

其中：

$$ z_0>0 $$

是一个固定常数。

这个平面上的任意三维点都可以写成：

$$ Q=(X,Y,z_0). $$

由于：

$$ Z=z_0 $$

已经固定，所以只需要：

$$ X,Y $$

两个变量来描述平面上的点。

因此我们可以为这个平面建立二维齐次坐标：

$$ \mathbf q\_{\text{plane}} = \begin{bmatrix} X\\Y\\1 \end{bmatrix}. $$

现在投影：

$$ u=f\frac{X}{z_0}, $$

$$ v=f\frac{Y}{z_0}. $$

我们希望写成：

$$ \mathbf q\_{\text{image}} \sim H\mathbf q\_{\text{plane}}. $$

注意我们可以选择：

$$ \mathbf q\_{\text{image}} = \begin{bmatrix} fX\\ fY\\ z_0 \end{bmatrix}. $$

而它恰好满足：

$$ \begin{bmatrix} fX\\ fY\\ z_0 \end{bmatrix} = \begin{bmatrix} f&0&0\\ 0&f&0\\ 0&0&z_0 \end{bmatrix} \begin{bmatrix} X\\Y\\1 \end{bmatrix}. $$

所以：

$$ \boxed{ H= \begin{bmatrix} f&0&0\\ 0&f&0\\ 0&0&z_0 \end{bmatrix} } $$

这个 $H$ 是 $3\times3$ 矩阵。

并且：

$$ \det H=f^2z_0. $$

因为：

$$ f>0,\qquad z_0>0, $$

所以：

$$ \det H\neq0. $$

因此 $H$ 可逆。

我们就得到了一个 Homography。

注意这个特殊情况下，Homography 归一化后实际上只是二维缩放。

但如果平面倾斜，Homography 就会产生真正的位置相关分母。

# 26. 推广到任意倾斜的三维平面

现在不再要求：

$$ Z=z_0. $$

我们考虑三维空间中的任意仿射平面。

选择平面上的固定点：

$$ \mathbf A\in\mathbb R^3. $$

再选择两个线性无关的平面内方向向量：

$$ \mathbf U,\mathbf V\in\mathbb R^3. $$

那么平面上的任意点都可以写成：

$$ \boxed{ \mathbf X(u,v) = \mathbf A+u\mathbf U+v\mathbf V } $$

这里：

- $\mathbf A$：平面上的参考点；
- $\mathbf U,\mathbf V$：平面的两个基方向；
- $u,v$：该平面内部的二维仿射坐标。

注意这里的小写 $u,v$ 是平面参数坐标，不是上一节的图像像素坐标。为了避免混淆，下面图像坐标统一使用 $(u',v')$。

将这个三维点写成齐次形式：

$$ \widetilde{\mathbf X}(u,v) = \begin{bmatrix} \mathbf A+u\mathbf U+v\mathbf V\\ 1 \end{bmatrix}. $$

展开：

$$ = u \begin{bmatrix} \mathbf U\\0 \end{bmatrix} + v \begin{bmatrix} \mathbf V\\0 \end{bmatrix} + \begin{bmatrix} \mathbf A\\1 \end{bmatrix}. $$

因此定义 $4\times3$ 矩阵：

$$ B= \begin{bmatrix} U_X&V_X&A_X\\ U_Y&V_Y&A_Y\\ U_Z&V_Z&A_Z\\ 0&0&1 \end{bmatrix}. $$

那么：

$$ \boxed{ \widetilde{\mathbf X}(u,v) = B \begin{bmatrix} u\\v\\1 \end{bmatrix} } $$

这一步很重要。

我们已经用一个 $4\times3$ 矩阵，把二维平面坐标嵌入三维世界齐次坐标。

现在使用相机投影：

$$ \mathbf q\_{\text{image}} \sim P\widetilde{\mathbf X}(u,v). $$

代入：

$$ \mathbf q\_{\text{image}} \sim PB \begin{bmatrix} u\\v\\1 \end{bmatrix}. $$

定义：

$$ \boxed{ H=PB } $$

由于：

$$ P\in\mathbb R^{3\times4}, $$

以及：

$$ B\in\mathbb R^{4\times3}, $$

所以：

$$ H\in\mathbb R^{3\times3}. $$

于是：

$$ \boxed{ \mathbf q\_{\text{image}} \sim H\mathbf q\_{\text{plane}} } $$

这就得到了任意三维平面到图像平面的 Homography。

这里需要一个条件：

$$ \boxed{ \text{三维平面不能经过相机中心} } $$

在这个条件下，且相机矩阵满行秩，$H$ 才是可逆的。

为什么？

因为如果平面经过相机中心，那么它对应的三维射影平面包含了相机矩阵的零空间。

于是存在非零平面齐次坐标 $\mathbf q\_{\text{plane}}$，使得：

$$ PB\mathbf q\_{\text{plane}}=\mathbf0. $$

这意味着：

$$ H=PB $$

不可逆。

从几何上看，经过相机中心的三维平面会投影成图像中的一条线，而不是覆盖整个二维图像平面。

# 27. 两台相机观察同一个平面，为什么两张图像之间存在 Homography？

这是实际计算机视觉中最常见的应用之一。

假设有一个三维平面，我们仍然使用它的二维齐次坐标：

$$ \mathbf q\_{\text{plane}}. $$

第一台相机：

$$ P_1. $$

第二台相机：

$$ P_2. $$

它们观察同一个三维平面。

设：

$$ H_1=P_1B, $$

$$ H_2=P_2B. $$

于是第一台相机中的图像点：

$$ \mathbf q_1 \sim H_1\mathbf q\_{\text{plane}}. $$

第二台相机中的图像点：

$$ \mathbf q_2 \sim H_2\mathbf q\_{\text{plane}}. $$

假设两个相机中心都不在这个平面上，那么 $H_1,H_2$ 都可逆。

由第一式：

$$ \mathbf q\_{\text{plane}} \sim H_1^{-1}\mathbf q_1. $$

代入第二式：

$$ \mathbf q_2 \sim H_2H_1^{-1}\mathbf q_1. $$

所以：

$$ \boxed{ \mathbf q_2 \sim H\_{21}\mathbf q_1 } $$

其中：

$$ \boxed{ H\_{21}=H_2H_1^{-1} } $$

这就是两张图像之间的平面诱导 Homography。

[$$OpenCV$$ Perspective Transformation (원근 변환) | 왜곡된 영상을 펴주는 방법 — moovzi’s Doodle](https://images.openai.com/static-rsc-4/zyt2KaWejQVaHRmjHRlHSBw9u70RMU3XyfTjgnj9uPXnrlZRm6E16rnTMqqt4SRuTRBLp_izFGJb0yxQcgiT7F0ZV3st3a7nz8deVNt_DK4e8bT7rcb1r0dvC1xn0OVteXYMzFrZg9mFeSESylS2lpZxlqPgkKOAV35wEYILzSg?purpose=inline)

[6 Mistakes in Architectural Photography and How to Avoid Them - Serhii Chrucky Architectural Photographer](https://images.openai.com/static-rsc-4/VvW_OWjASotlqa7JTMt1nKImNoIhxIriduOdYnIPuygR8fT51uue-6ZFhF9ElO_5DDtx0OngaI271H9EUzIn7tMVMgo4nzLC70NLqsDANigROQ6KBU3JOS0Nt0p8TfbWGwRkZ9ceKEz9AVoKR0GlhmgXyKQCn_67Xe-R47Whsd4?purpose=inline)

[android - Rotate a detected rectangle in openCV Java - Stack Overflow](https://images.openai.com/static-rsc-4/34w6xmegNR7W81jdFjEiLRn8wBwxGySeOw1q256Ol9LpOZSY3OEWGh-us8sPtFM_jHy9TBpliEUwmpAMjzdGqdlzhy1ldczc8Fh8yNdHfSrX2a7nnk037Q8VKsT7r_q-Z5rXaMzlvptooAr3Rd54TLbbQ_db5LLOOC1LQaoZbNY?purpose=inline)

12

因此：

$$ \boxed{ \text{同一个三维平面在两个视角下的图像，通常可以通过一个 Homography 相互映射} } $$

这里还有一个非常重要的限制：

如果场景中的点不在同一个平面上，并且相机中心发生平移，那么一般不能用单个 Homography 准确描述整幅图像的对应关系。

因为不同深度的物体会产生不同的视差（parallax）。

这也解释了为什么拍摄一个真正的立体场景时，单个 $3\times3$ 矩阵通常无法让两张图片中的全部物体完美对齐。

# 28. 终于进入 Perspective-Correct Interpolation

现在我们开始研究你之前一直感兴趣的计算机图形学问题：

$$ \boxed{ \text{Perspective-Correct Interpolation} } $$

即：

透视正确插值。

我们先提出一个问题。

假设三维空间中有一条线段。

线段两个端点分别具有纹理坐标：

$$ a_0=0, $$

$$ a_1=1. $$

我们将这条线段投影到屏幕上。

现在在屏幕上找到投影线段的中点。

它对应原来三维线段上的中点吗？

一般来说：

$$ \boxed{ \text{不对应} } $$

因为透视投影是非线性的。

这正是 perspective-correct interpolation 必须存在的原因。

# 29. 从最简单的一条三维线段开始推导

为了简化，我们只研究 $XZ$ 平面。

两个三维端点：

$$ Q_0=(X_0,Z_0), $$

$$ Q_1=(X_1,Z_1). $$

这里省略 $Y$ 坐标，因为它不影响这一维推导。

要求：

$$ Z_0>0,\qquad Z_1>0. $$

另外假设它们投影到两个不同的屏幕位置。

我们使用线段参数：

$$ t\in[0,1]. $$

三维线段上的点：

$$ \boxed{ Q(t)=(1-t)Q_0+tQ_1 } $$

因此：

$$ X(t)=(1-t)X_0+tX_1, $$

$$ Z(t)=(1-t)Z_0+tZ_1. $$

这里的 $t$ 是三维线段上的仿射参数。

如果：

$$ t=0, $$

得到第一个端点。

如果：

$$ t=1, $$

得到第二个端点。

如果：

$$ t=\frac12, $$

得到三维线段的真正中点。

# 30. 先投影两个端点

焦距为：

$$ f>0. $$

两个端点的屏幕横坐标：

$$ x_0=f\frac{X_0}{Z_0}, $$

$$ x_1=f\frac{X_1}{Z_1}. $$

三维线段上的任意点 $Q(t)$ 投影后：

$$ x(t) = f\frac{X(t)}{Z(t)}. $$

代入：

$$ \boxed{ x(t) = f\frac{ (1-t)X_0+tX_1 }{ (1-t)Z_0+tZ_1 } } $$

注意这个函数的分母：

$$ (1-t)Z_0+tZ_1 $$

依赖于 $t$。

所以 $x(t)$ 一般不是关于 $t$ 的仿射函数。

也就是说：

$$ \boxed{ x(t)\neq(1-t)x_0+tx_1 } $$

一般不成立。

这就是问题的根源。

# 31. 屏幕空间中的参数与三维空间中的参数不同

现在定义屏幕线段上的仿射插值参数：

$$ s= \frac{x(t)-x_0}{x_1-x_0}. $$

其中：

$$ x_0\neq x_1. $$

于是：

$$ x(t)=(1-s)x_0+sx_1. $$

注意：

- $t$：三维线段上的参数；
- $s$：投影后屏幕线段上的参数。

一般情况下：

$$ \boxed{ s\neq t } $$

我们现在推导它们的精确关系。

## 31.1 使用端点的投影坐标

因为：

$$ x_0=f\frac{X_0}{Z_0}, $$

所以：

$$ fX_0=Z_0x_0. $$

同理：

$$ fX_1=Z_1x_1. $$

因此：

$$ x(t) = \frac{ (1-t)Z_0x_0+tZ_1x_1 }{ (1-t)Z_0+tZ_1 }. $$

为了简化，定义：

$$ D(t)=(1-t)Z_0+tZ_1. $$

那么：

$$ x(t) = \frac{ (1-t)Z_0x_0+tZ_1x_1 }{ D(t) }. $$

因为：

$$ D(t)=(1-t)Z_0+tZ_1, $$

所以分子的两个系数之和恰好等于分母。

于是可以写成：

$$ x(t) = \frac{(1-t)Z_0}{D(t)}x_0 + \frac{tZ_1}{D(t)}x_1. $$

对比屏幕插值形式：

$$ x(t)=(1-s)x_0+sx_1. $$

由于 $x_0\neq x_1$，屏幕线段参数唯一，因此：

$$ \boxed{ 1-s=\frac{(1-t)Z_0}{D(t)} } $$

以及：

$$ \boxed{ s=\frac{tZ_1}{D(t)} } $$

这就是三维参数与屏幕参数的精确关系。

# 32. 反过来：给定屏幕参数 $s$，怎么求三维参数 $t$？

我们已经有：

$$ 1-s=\frac{(1-t)Z_0}{D(t)}, $$

$$ s=\frac{tZ_1}{D(t)}. $$

两式分别除以深度：

$$ \frac{1-s}{Z_0} = \frac{1-t}{D(t)}, $$

$$ \frac{s}{Z_1} = \frac{t}{D(t)}. $$

两式相加：

$$ \frac{1-s}{Z_0} + \frac{s}{Z_1} = \frac{1-t+t}{D(t)}. $$

因此：

$$ \frac{1-s}{Z_0} + \frac{s}{Z_1} = \frac1{D(t)}. $$

现在再利用：

$$ \frac{s}{Z_1} = \frac{t}{D(t)}. $$

两边除以刚才求出的 $1/D(t)$：

$$ \boxed{ t= \frac{ \frac{s}{Z_1} }{ \frac{1-s}{Z_0}+\frac{s}{Z_1} } } $$

这个公式就是一维透视正确插值的核心。

注意出现了：

$$ \frac1{Z_0}, \qquad \frac1{Z_1}. $$

为什么会出现倒数深度？

因为我们需要抵消透视投影引入的位置相关分母。

# 33. 现在真正推导属性的透视正确插值

假设三维线段两个端点有属性：

$$ a_0,\qquad a_1. $$

例如：

- 纹理坐标；
- 颜色属性；
- 顶点携带的某个标量；
- 其他按照三维仿射参数线性变化的属性。

假设该属性沿三维线段按 $t$ 线性变化：

$$ a(t)=(1-t)a_0+ta_1. $$

现在我们已知屏幕参数 $s$，需要计算正确的 $a$。

先把上面推导的：

$$ 1-t = \frac{ \frac{1-s}{Z_0} }{ \frac{1-s}{Z_0}+\frac{s}{Z_1} } $$

以及：

$$ t= \frac{ \frac{s}{Z_1} }{ \frac{1-s}{Z_0}+\frac{s}{Z_1} } $$

代入属性公式。

得到：

$$ a(s) = \frac{ \frac{1-s}{Z_0} }{ \frac{1-s}{Z_0}+\frac{s}{Z_1} }a_0 + \frac{ \frac{s}{Z_1} }{ \frac{1-s}{Z_0}+\frac{s}{Z_1} }a_1. $$

合并分母：

$$ \boxed{ a(s) = \frac{ (1-s)\frac{a_0}{Z_0} + s\frac{a_1}{Z_1} }{ (1-s)\frac1{Z_0} + s\frac1{Z_1} } } $$

这就是最基础的：

$$ \boxed{ \text{Perspective-Correct Interpolation} } $$

它和普通线性插值：

$$ a\_{\text{affine}}(s) = (1-s)a_0+sa_1 $$

不同。

它需要先插值：

$$ \frac aZ $$

以及：

$$ \frac1Z, $$

然后再相除。

这就是 GPU 光栅化器进行透视正确插值的数学原理。

# 34. 一个数值例子：屏幕中点并不是三维中点

取：

$$ f=1. $$

三维线段两个端点：

$$ Q_0=(0,1), $$

$$ Q_1=(3,3). $$

这里两个坐标分别是：

$$ (X,Z). $$

所以：

$$ X_0=0,\quad Z_0=1, $$

$$ X_1=3,\quad Z_1=3. $$

两个点投影后：

$$ x_0=\frac01=0, $$

$$ x_1=\frac33=1. $$

所以屏幕线段的两个端点是：

$$ 0,\qquad1. $$

现在我们取屏幕中点：

$$ x=\frac12. $$

那么：

$$ s=\frac12. $$

我们要问：

屏幕中点对应三维线段上的哪个 $t$？

使用透视参数公式：

$$ t= \frac{ \frac{s}{Z_1} }{ \frac{1-s}{Z_0}+\frac{s}{Z_1} }. $$

代入：

$$ t= \frac{ \frac{1/2}{3} }{ \frac{1/2}{1}+\frac{1/2}{3} }. $$

即：

$$ t= \frac{\frac16}{\frac12+\frac16}. $$

因为：

$$ \frac12+\frac16=\frac23, $$

所以：

$$ t= \frac{\frac16}{\frac23} = \frac14. $$

因此：

$$ \boxed{ s=\frac12 \quad\Longrightarrow\quad t=\frac14 } $$

屏幕中点实际上对应三维线段上只有四分之一的位置。

如果属性为：

$$ a_0=0,\qquad a_1=1, $$

那么正确插值结果：

$$ a=\frac14. $$

而普通屏幕线性插值会错误地得到：

$$ a\_{\text{affine}}=\frac12. $$

所以：

$$ \boxed{ a\_{\text{correct}}=0.25, \qquad a\_{\text{affine}}=0.5 } $$

误差非常明显。

交互实验：屏幕插值与透视正确插值

屏幕插值参数 $s$

0.64

普通屏幕线性插值

# 0.640

透视正确插值

# 0.372

设置 $Z_0=1$、$Z_1=3$、$a_0=0$、$a_1=1$。拖动滑块，观察投影线段上的位置与三维线段上的真实参数怎样不同。

# 35. 推广到三角形：GPU 真正使用的公式

现在进入三角形光栅化。

假设有一个三维三角形，顶点为：

$$ Q_0,\quad Q_1,\quad Q_2. $$

顶点在相机坐标中的深度分别为：

$$ Z_0,\quad Z_1,\quad Z_2. $$

暂时假设：

$$ Z_i>0. $$

并且三个投影顶点不共线。

考虑三角形内部的一个三维点 $Q$。

它可以用三维仿射重心坐标表示：

$$ \boxed{ Q=\lambda_0Q_0+\lambda_1Q_1+\lambda_2Q_2 } $$

其中：

$$ \lambda_0+\lambda_1+\lambda_2=1. $$

如果 $Q$ 位于三角形内部，通常还有：

$$ \lambda_i\geq0. $$

对于在三角形上仿射变化的属性 $a$，我们希望：

$$ \boxed{ a=\lambda_0a_0+\lambda_1a_1+\lambda_2a_2 } $$

但 GPU 光栅化器面对的是投影后的二维三角形。

它计算的是屏幕重心坐标：

$$ \beta_0,\quad\beta_1,\quad\beta_2, $$

其中：

$$ \beta_0+\beta_1+\beta_2=1. $$

一般情况下：

$$ \boxed{ \beta_i\neq\lambda_i } $$

那么应该如何将：

$$ \beta_i $$

转换成正确的：

$$ \lambda_i? $$

# 36. 推导三维重心坐标和屏幕重心坐标的关系

设三维顶点：

$$ Q_i=(X_i,Y_i,Z_i), \qquad i=0,1,2. $$

焦距为：

$$ f>0. $$

投影后的普通二维顶点坐标：

$$ u_i=f\frac{X_i}{Z_i}, $$

$$ v_i=f\frac{Y_i}{Z_i}. $$

因此对应齐次图像向量可以选择：

$$ \widetilde{\mathbf q}\_i = \begin{bmatrix} fX_i\\fY_i\\Z_i \end{bmatrix}. $$

现在注意：

$$ \widetilde{\mathbf q}\_i = Z_i \begin{bmatrix} u_i\\v_i\\1 \end{bmatrix}. $$

而三维点：

$$ Q=\sum\_{i=0}^{2}\lambda_iQ_i. $$

由于投影前的齐次矩阵运算是线性的，所以：

$$ \widetilde{\mathbf q} = \sum\_{i=0}^{2} \lambda_i\widetilde{\mathbf q}\_i. $$

代入：

$$ \widetilde{\mathbf q} = \sum\_{i=0}^{2} \lambda_iZ_i \begin{bmatrix} u_i\\v_i\\1 \end{bmatrix}. $$

最后一个齐次分量：

$$ w=\sum\_{i=0}^{2}\lambda_iZ_i. $$

因此做齐次归一化：

$$ \begin{bmatrix} u\\v\\1 \end{bmatrix} = \sum\_{i=0}^{2} \frac{\lambda_iZ_i} {\sum\_{j=0}^{2}\lambda_jZ_j} \begin{bmatrix} u_i\\v_i\\1 \end{bmatrix}. $$

而根据二维重心坐标定义：

$$ \begin{bmatrix} u\\v\\1 \end{bmatrix} = \sum\_{i=0}^{2} \beta_i \begin{bmatrix} u_i\\v_i\\1 \end{bmatrix}. $$

由于投影三角形不退化，其重心坐标唯一，所以可以逐项对应：

$$ \boxed{ \beta_i = \frac{ \lambda_iZ_i }{ \sum\_{j=0}^{2}\lambda_jZ_j } } $$

这就是屏幕重心坐标与三维重心坐标之间的关系。

# 37. 反过来求真正的三维权重

我们现在希望从：

$$ \beta_i $$

求：

$$ \lambda_i. $$

定义：

$$ D=\sum\_{j=0}^{2}\lambda_jZ_j. $$

根据刚才的公式：

$$ \beta_i=\frac{\lambda_iZ_i}{D}. $$

两边除以 $Z_i$：

$$ \frac{\beta_i}{Z_i} = \frac{\lambda_i}{D}. $$

所以：

$$ \lambda_i = D\frac{\beta_i}{Z_i}. $$

现在使用：

$$ \lambda_0+\lambda_1+\lambda_2=1. $$

得到：

$$ D\sum\_{i=0}^{2}\frac{\beta_i}{Z_i}=1. $$

所以：

$$ D= \frac1{ \sum\_{i=0}^{2}\frac{\beta_i}{Z_i} }. $$

将 $D$ 代回：

$$ \lambda_i = \frac{ \frac{\beta_i}{Z_i} }{ \sum\_{j=0}^{2}\frac{\beta_j}{Z_j} }. $$

因此：

$$ \boxed{ \lambda_i = \frac{\beta_i/Z_i} {\beta_0/Z_0+\beta_1/Z_1+\beta_2/Z_2} } $$

最后属性：

$$ a=\sum\_{i=0}^{2}\lambda_i a_i. $$

代入：

$$ \boxed{ a= \frac{ \beta_0\frac{a_0}{Z_0} + \beta_1\frac{a_1}{Z_1} + \beta_2\frac{a_2}{Z_2} }{ \beta_0\frac1{Z_0} + \beta_1\frac1{Z_1} + \beta_2\frac1{Z_2} } } $$

这就是三角形光栅化的经典透视正确插值公式。

在某些图形管线的实现中，使用的是裁剪空间的 $w\_{\text{clip}}$，而不是直接使用相机空间深度 $Z$。

对于我们本章选定的投影约定：

$$ w\_{\text{clip}}=Z $$

可以这样构造。

但在其他坐标约定下，例如某些以相机 $-Z$ 为前方的管线，二者之间可能有符号差异。

因此更一般的公式是：

$$ \boxed{ a= \frac{ \sum_i\beta_i\frac{a_i}{w_i} }{ \sum_i\beta_i\frac1{w_i} } } $$

其中 $w_i$ 是各个顶点的裁剪空间齐次 $w$ 分量。

# 38. 为什么 GPU 可以只插值 $1/w$ 和 $a/w$？

回忆我们刚才推导的公式：

$$ a= \frac{ \sum_i\beta_i a_i/w_i }{ \sum_i\beta_i/w_i }. $$

定义新的顶点属性：

$$ r_i=\frac1{w_i}, $$

以及：

$$ b_i=\frac{a_i}{w_i}. $$

那么在屏幕三角形中，直接对它们做普通重心插值：

$$ r=\sum_i\beta_i r_i, $$

$$ b=\sum_i\beta_i b_i. $$

最后计算：

$$ \boxed{ a=\frac br } $$

因此流程就是：

$$ \boxed{ \begin{array}{c} \text{顶点属性 }a_i,\ w_i\\[4pt] \downarrow\\[4pt] a_i/w_i,\quad 1/w_i\\[4pt] \downarrow\text{ 屏幕空间仿射插值}\\[4pt] b,\quad r\\[4pt] \downarrow\\[4pt] a=b/r \end{array} } $$

这非常重要，因为它解释了硬件光栅化器为什么可以用屏幕空间中的仿射插值来实现透视正确的属性插值。

顺便补充一个细节：

并不是所有 GPU 变量都需要按照同一种方式插值。

例如在常见的标准透视投影中，深度缓冲使用的归一化设备深度（NDC depth）可以直接在屏幕空间线性插值。

原因是标准透视投影可使：

$$ z\_{\mathrm{ndc}} = A+\frac BZ, $$

其中 $A,B$ 是由投影矩阵确定的常数。

我们已经证明：

$$ \frac1Z = \sum_i\beta_i\frac1{Z_i}. $$

所以：

$$ z\_{\mathrm{ndc}} = \sum_i\beta_i \left( A+\frac B{Z_i} \right). $$

利用：

$$ \sum_i\beta_i=1, $$

得到：

$$ \boxed{ z\_{\mathrm{ndc}} = \sum_i\beta_i z\_{\mathrm{ndc},i} } $$

因此它可以在屏幕空间直接仿射插值。

而相机空间中的真实深度 $Z$ 本身通常不是屏幕空间线性的。

这两个深度概念千万不要混淆。

# 39. 这和 Rational Bézier、NURBS 有什么关系？

现在来连接你已经学过的 NURBS 知识。

回忆一条有理曲线的形式：

$$ \boxed{ C(t) = \frac{ \sum_i N_i(t)\omega_i P_i }{ \sum_i N_i(t)\omega_i } } $$

其中：

- $N_i(t)$：基函数；
- $\omega_i$：控制点权重；
- $P_i$：控制点；
- $t$：曲线参数。

在 NURBS 中，我们可以先构造更高维的齐次控制点：

$$ \widetilde P_i = \begin{bmatrix} \omega_iP_i\\ \omega_i \end{bmatrix}. $$

然后在线性空间中进行基函数组合：

$$ \widetilde C(t) = \sum_iN_i(t)\widetilde P_i. $$

最后齐次归一化：

$$ C(t) = \frac{ \text{前面的位置分量} }{ \text{最后的权重分量} }. $$

现在回顾 perspective-correct interpolation：

$$ a= \frac{ \sum_i\beta_i a_i/w_i }{ \sum_i\beta_i/w_i }. $$

有没有发现形式非常相似？

如果形式上定义：

$$ \omega_i=\frac1{w_i}, $$

那么：

$$ a= \frac{ \sum_i\beta_i\omega_i a_i }{ \sum_i\beta_i\omega_i }. $$

这和有理插值的结构完全相同。

不过二者的权重来源不一样：

- NURBS 权重通常是曲线、曲面建模参数的一部分；
- 透视正确插值中的 $1/w_i$ 来源于投影过程；
- 重心坐标 $\beta_i$ 与 NURBS 基函数也不是同一类对象。

但它们共享同一个核心代数思想：

$$ \boxed{ \text{在齐次空间中进行线性组合，再通过齐次除法恢复结果} } $$

这就是为什么你会在射影几何、透视投影、NURBS、有理 Bézier 和透视正确插值中反复看到相同形式。

# 40. 本章最重要的完整知识链

现在我们把本章得到的结果统一起来。

## 第一层：透视投影的几何本质

针孔相机中：

$$ \boxed{ u=f\frac XZ,\qquad v=f\frac YZ } $$

它来自三维观察射线与成像平面的交点。

## 第二层：投影的齐次表达

三维世界点：

$$ \widetilde{\mathbf X}\in\mathbb R^4. $$

二维图像齐次点：

$$ \mathbf q\in\mathbb R^3. $$

它们满足：

$$ \boxed{ \mathbf q\sim P\widetilde{\mathbf X} } $$

其中：

$$ \boxed{ P=K[R\mid\mathbf t] } $$

是针孔相机矩阵。

## 第三层：投影为什么不可逆

因为不同的三维点可以位于同一条观察射线上，从而投影到同一个二维点。

相机中心是：

$$ \boxed{ \ker P } $$

对应的一维线性子空间的射影化。

## 第四层：消失点

三维方向：

$$ \mathbf D_w $$

对应三维无穷远点：

$$ [\mathbf D_w:0]. $$

投影后：

$$ \boxed{ \mathbf q\_\infty\sim KR\mathbf D_w } $$

所以消失点是三维无穷远方向的图像。

## 第五层：平面 Homography

如果三维点受限于一个不经过相机中心的平面，那么存在：

$$ \boxed{ H=PB } $$

将平面的二维射影坐标映射到图像射影坐标。

对于同一平面的两张图像：

$$ \boxed{ \mathbf q_2\sim H_2H_1^{-1}\mathbf q_1 } $$

## 第六层：透视正确插值

由于透视投影改变仿射插值参数，三维属性不能直接使用屏幕重心坐标线性插值。

正确关系是：

$$ \boxed{ \lambda_i= \frac{\beta_i/w_i} {\sum_j\beta_j/w_j} } $$

最终：

$$ \boxed{ a= \frac{ \sum_i\beta_i a_i/w_i }{ \sum_i\beta_i/w_i } } $$

# 41. 本章的最终统一思想

如果你只记住这一章的一件事，我希望是：

$$ \boxed{ \text{投影本身不是仿射线性的，但可以由线性齐次映射加归一化表示} } $$

整个过程：

$$ \begin{array}{c} \text{三维仿射空间 }\mathbb R^3\\[4pt] \downarrow\text{ 加入齐次坐标}\\[4pt] \text{三维射影空间 }\mathbb P^3\\[4pt] \downarrow\text{ 相机矩阵 }P\\[4pt] \text{二维射影空间 }\mathbb P^2\\[4pt] \downarrow\text{ 选择有限仿射图}\\[4pt] \text{二维图像坐标 }\mathbb R^2 \end{array} $$

其中非线性的分式结构主要来自最后一步的齐次归一化：

$$ \boxed{ u=\frac xw,\qquad v=\frac yw } $$

而我们已经看到：

- 近大远小来自这个除法；
- 消失点来自无穷远方向经过投影；
- 平面 Homography 来自把三维投影限制在二维射影平面上；
- 透视正确插值来自对这个除法造成的权重变化进行修正。

这四件事并不是分散的技巧，而是同一套射影几何结构的不同表现。

## 下一章：射影对偶性（Projective Duality）

接下来很适合回到更纯粹的射影几何理论，专门研究前面一直提到、但还没有系统展开的：

$$ \boxed{ \text{Projective Duality} } $$

即射影对偶性。

我们会从最简单的两个公式出发：

$$ \mathbf l=\mathbf p_1\times\mathbf p_2, $$

$$ \mathbf p=\mathbf l_1\times\mathbf l_2. $$

然后严格解释：

1. 为什么 $\mathbb P^2$ 中的点与直线看起来完全对称。
2. 对偶空间 $V^*$ 究竟是什么，为什么它不是简单地“再复制一个 $V$”。
3. 为什么射影直线的坐标实际上是对偶向量。
4. 为什么点按照 $H$ 变换，直线却按照 $H^{-T}$ 变换。
5. 如何将点线对偶推广到 $\mathbb P^n$ 中的超平面。
6. 为什么射影几何中的很多定理，只需交换“点”和“直线”，就能得到另一个对偶定理。

这一章也会把你之前学习的线性子空间、零空间、正交补、超平面、线性泛函和对偶空间进一步统一起来。
