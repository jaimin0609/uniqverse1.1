-- AlterTable
ALTER TABLE "_CategoryToCoupon" ADD CONSTRAINT "_CategoryToCoupon_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_CategoryToCoupon_AB_unique";

-- AlterTable
ALTER TABLE "_CouponToProduct" ADD CONSTRAINT "_CouponToProduct_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_CouponToProduct_AB_unique";
